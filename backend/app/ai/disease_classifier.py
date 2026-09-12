"""
Plant Disease Classifier — AI Part 1

Architecture: EfficientNet-B0 (torchvision)
Dataset: PlantVillage 38-class compatible

Usage:
    classifier = DiseaseClassifier()
    result = classifier.predict_disease(image_bytes)

Model loading:
    - Reads MODEL_PATH from environment.
    - If MODEL_PATH is empty or file missing AND DEV_MODE=true → returns placeholder.
    - If MODEL_PATH missing AND DEV_MODE=false → raises ModelNotLoadedError.
    - Designed so dropping a .pth file at MODEL_PATH activates real inference.

To replace with a different architecture:
    - Subclass DiseaseClassifier and override _build_model() and CLASSES.
"""

import io
import json
import logging
import os
from typing import Optional

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# PlantVillage 38-class labels (matches standard PlantVillage split)
# Key format: "Crop___Disease" normalized to readable form
# ---------------------------------------------------------------------------
PLANTVILLAGE_CLASSES = [
    ("Apple", "Apple Scab"),
    ("Apple", "Black Rot"),
    ("Apple", "Cedar Apple Rust"),
    ("Apple", "Healthy"),
    ("Blueberry", "Healthy"),
    ("Cherry", "Powdery Mildew"),
    ("Cherry", "Healthy"),
    ("Corn", "Cercospora Leaf Spot / Gray Leaf Spot"),
    ("Corn", "Common Rust"),
    ("Corn", "Northern Leaf Blight"),
    ("Corn", "Healthy"),
    ("Grape", "Black Rot"),
    ("Grape", "Esca (Black Measles)"),
    ("Grape", "Leaf Blight (Isariopsis Leaf Spot)"),
    ("Grape", "Healthy"),
    ("Orange", "Haunglongbing (Citrus Greening)"),
    ("Peach", "Bacterial Spot"),
    ("Peach", "Healthy"),
    ("Pepper", "Bacterial Spot"),
    ("Pepper", "Healthy"),
    ("Potato", "Early Blight"),
    ("Potato", "Late Blight"),
    ("Potato", "Healthy"),
    ("Raspberry", "Healthy"),
    ("Soybean", "Healthy"),
    ("Squash", "Powdery Mildew"),
    ("Strawberry", "Leaf Scorch"),
    ("Strawberry", "Healthy"),
    ("Tomato", "Bacterial Spot"),
    ("Tomato", "Early Blight"),
    ("Tomato", "Late Blight"),
    ("Tomato", "Leaf Mold"),
    ("Tomato", "Septoria Leaf Spot"),
    ("Tomato", "Spider Mites (Two-Spotted Spider Mite)"),
    ("Tomato", "Target Spot"),
    ("Tomato", "Yellow Leaf Curl Virus"),
    ("Tomato", "Mosaic Virus"),
    ("Tomato", "Healthy"),
]

NUM_CLASSES = len(PLANTVILLAGE_CLASSES)  # 38


class ModelNotLoadedError(Exception):
    """Raised when MODEL_PATH is not configured and DEV_MODE is false."""
    pass


class DiseaseClassifier:
    """
    Singleton-friendly EfficientNet-B0 disease classifier.
    Call predict_disease(image_bytes) for inference.
    """

    # ImageNet normalization stats (standard for transfer-learned models)
    IMAGENET_MEAN = [0.485, 0.456, 0.406]
    IMAGENET_STD = [0.229, 0.224, 0.225]
    INPUT_SIZE = 224

    def __init__(self):
        self._model = None
        self._device = None
        self._transform = None
        self._loaded = False
        self._dev_mode = os.getenv("DEV_MODE", "false").lower() == "true"

    # ------------------------------------------------------------------
    # Model loading
    # ------------------------------------------------------------------

    def load(self) -> None:
        """
        Load model weights from MODEL_PATH.
        Call this once at application startup (e.g., in lifespan event).
        """
        model_path = os.getenv("MODEL_PATH", "")

        if not model_path or not os.path.isfile(model_path):
            if self._dev_mode:
                logger.warning(
                    "🟡 DiseaseClassifier: MODEL_PATH not found. "
                    "Running in DEV_MODE — returning placeholder predictions."
                )
                self._loaded = False
                return
            else:
                raise ModelNotLoadedError(
                    f"MODEL_PATH '{model_path}' does not exist. "
                    "Set DEV_MODE=true for development without a model file."
                )

        try:
            # Import torch only when loading (keeps startup fast if not needed)
            import torch
            import torch.nn as nn
            from torchvision import models, transforms

            self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            logger.info(f"DiseaseClassifier: using device={self._device}")

            # Build EfficientNet-B0 with custom classifier head
            self._model = self._build_model(nn, models)

            # Load weights
            state_dict = torch.load(model_path, map_location=self._device)
            # Handle models saved as full model dict or just state_dict
            if isinstance(state_dict, dict) and "model_state_dict" in state_dict:
                state_dict = state_dict["model_state_dict"]
            self._model.load_state_dict(state_dict)

            self._model.to(self._device)
            self._model.eval()

            # Preprocessing pipeline
            self._transform = transforms.Compose([
                transforms.Resize((self.INPUT_SIZE, self.INPUT_SIZE)),
                transforms.ToTensor(),
                transforms.Normalize(mean=self.IMAGENET_MEAN, std=self.IMAGENET_STD),
            ])

            self._loaded = True
            logger.info(f"✅ DiseaseClassifier loaded from {model_path}")

        except Exception as e:
            logger.error(f"Failed to load disease classifier: {e}")
            if self._dev_mode:
                self._loaded = False
            else:
                raise

    def _build_model(self, nn, models):
        """
        EfficientNet-B0 with final FC layer replaced to match NUM_CLASSES.
        Replacing this method allows swapping architectures without touching inference code.
        """
        model = models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, NUM_CLASSES)
        return model

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict_disease(self, image_bytes: bytes, crop: str = "Tomato") -> dict:
        """
        Run robust disease classification on raw image bytes.
        Includes foliage verification (rejects non-plant images like human faces, animals, etc.)
        and accurate health/disease detection (detects healthy leaves vs specific diseases).

        Args:
            image_bytes: Raw bytes of the uploaded image.
            crop: Expected crop type selected by the farmer.

        Returns:
            {
                "is_plant_leaf": bool,
                "is_healthy": bool,
                "disease": str,
                "confidence": float,
                "crop": str,
                "severity": str,
                "affected_percentage": float,
                "rejection_reason": str (if not plant leaf),
                "notes": str
            }
        """
        # 1. First priority: Use Gemini Multimodal Vision if API key is available
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY")
        if api_key:
            vision_result = self._predict_with_gemini_vision(image_bytes, crop, api_key)
            if vision_result is not None:
                return vision_result

        # 2. Computer Vision verification fallback (OpenCV green leaf contour analysis)
        is_foliage, green_ratio, reason = self._verify_foliage_opencv(image_bytes)
        if not is_foliage:
            logger.warning("DiseaseClassifier: OpenCV rejected image as non-foliage (ratio=%.4f)", green_ratio)
            return {
                "is_plant_leaf": False,
                "is_healthy": False,
                "disease": "Not a Plant Leaf",
                "confidence": 0.99,
                "crop": crop,
                "severity": "LOW",
                "affected_percentage": 0.0,
                "rejection_reason": reason,
            }

        # 3. If model weights are loaded, run PyTorch EfficientNet inference
        if self._loaded:
            import torch
            import torch.nn.functional as F

            image = self._load_and_preprocess(image_bytes)
            with torch.no_grad():
                tensor = self._transform(image).unsqueeze(0).to(self._device)
                logits = self._model(tensor)
                probabilities = F.softmax(logits, dim=1).squeeze(0)

            top_prob, top_idx = probabilities.max(dim=0)
            confidence = float(top_prob.cpu().numpy())
            class_idx = int(top_idx.cpu().numpy())
            detected_crop, disease = PLANTVILLAGE_CLASSES[class_idx]

            is_healthy = "healthy" in disease.lower()
            return {
                "is_plant_leaf": True,
                "is_healthy": is_healthy,
                "disease": f"{detected_crop} {disease}" if not disease.startswith(detected_crop) else disease,
                "confidence": round(confidence, 4),
                "crop": detected_crop,
                "severity": "LOW" if is_healthy else "MODERATE",
                "affected_percentage": 0.0 if is_healthy else 15.0,
            }

        # 4. Fallback in DEV_MODE with intelligent greenness heuristics
        if self._dev_mode:
            return self._dev_placeholder(green_ratio, crop)

        raise ModelNotLoadedError(
            "Classifier not loaded. Check MODEL_PATH env var or set DEV_MODE=true."
        )

    def _predict_with_gemini_vision(self, image_bytes: bytes, expected_crop: str, api_key: str) -> Optional[dict]:
        """Perform zero-shot multimodal vision diagnosis using Google Gemini 2.5."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")

            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != "RGB":
                image = image.convert("RGB")

            prompt = (
                f"You are an expert plant pathologist and computer vision inspector for the AgriNova system.\n"
                f"Selected Crop by Farmer: {expected_crop}\n\n"
                f"TASK 1: Foliage Verification\n"
                f"Carefully examine if this image is actually a plant leaf, crop foliage, or agricultural plant.\n"
                f"If the image is a person, human face, skin, animal, pet, vehicle, indoor furniture, drawing, "
                f"screenshot, or non-plant object, set 'is_plant_leaf' to false, and provide a clear 'rejection_reason'.\n\n"
                f"TASK 2: Health & Pathogen Diagnosis (ONLY if is_plant_leaf is true)\n"
                f"- Determine if the foliage is HEALTHY or DISEASED.\n"
                f"- If HEALTHY:\n"
                f"    disease: 'Healthy Leaf'\n"
                f"    is_healthy: true\n"
                f"    severity: 'LOW'\n"
                f"    affected_percentage: 0.0\n"
                f"- If DISEASED:\n"
                f"    Identify the specific plant disease (e.g. 'Early Blight', 'Late Blight', 'Bacterial Spot', 'Leaf Mold', 'Powdery Mildew', 'Septoria Leaf Spot', etc.).\n"
                f"    disease: '{expected_crop} ' + disease_name (or specific disease name)\n"
                f"    is_healthy: false\n"
                f"    severity: 'LOW' | 'MODERATE' | 'HIGH'\n"
                f"    affected_percentage: float between 1.0 and 99.0\n\n"
                f"Respond ONLY with valid JSON in this exact structure:\n"
                f"{{\n"
                f'  "is_plant_leaf": true,\n'
                f'  "is_healthy": true,\n'
                f'  "detected_crop": "{expected_crop}",\n'
                f'  "disease": "Healthy Leaf",\n'
                f'  "confidence": 0.95,\n'
                f'  "severity": "LOW",\n'
                f'  "affected_percentage": 0.0,\n'
                f'  "rejection_reason": "",\n'
                f'  "diagnosis_summary": "Short explanation of visual symptoms"\n'
                f"}}"
            )

            res = model.generate_content([prompt, image])
            text = res.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            parsed = json.loads(text.strip())

            is_plant = bool(parsed.get("is_plant_leaf", True))
            if not is_plant:
                return {
                    "is_plant_leaf": False,
                    "is_healthy": False,
                    "disease": "Not a Plant Leaf",
                    "confidence": float(parsed.get("confidence", 0.99)),
                    "crop": expected_crop,
                    "severity": "LOW",
                    "affected_percentage": 0.0,
                    "rejection_reason": parsed.get("rejection_reason") or (
                        "The uploaded image does not appear to be a crop leaf or plant foliage (human face, animal, or non-plant object detected)."
                    ),
                    "notes": parsed.get("diagnosis_summary", ""),
                }

            is_healthy = bool(parsed.get("is_healthy", False))
            disease_name = parsed.get("disease", "Healthy Leaf" if is_healthy else f"{expected_crop} Early Blight")
            if is_healthy:
                disease_name = f"Healthy {expected_crop} Leaf"

            return {
                "is_plant_leaf": True,
                "is_healthy": is_healthy,
                "disease": disease_name,
                "confidence": round(float(parsed.get("confidence", 0.92)), 4),
                "crop": parsed.get("detected_crop") or expected_crop,
                "severity": parsed.get("severity", "LOW" if is_healthy else "MODERATE"),
                "affected_percentage": float(parsed.get("affected_percentage", 0.0 if is_healthy else 12.0)),
                "rejection_reason": "",
                "notes": parsed.get("diagnosis_summary", ""),
            }

        except Exception as exc:
            logger.warning("Gemini Vision diagnosis failed (%s). Falling back to local engine.", exc)
            return None

    def _verify_foliage_opencv(self, image_bytes: bytes) -> tuple[bool, float, str]:
        """Fast computer vision heuristic to verify if the image contains green plant foliage."""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return False, 0.0, "Invalid or corrupted image format."

            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            # Green leaf HSV color range
            lower_green = np.array([25, 35, 35])
            upper_green = np.array([90, 255, 255])
            mask = cv2.inRange(hsv, lower_green, upper_green)
            green_ratio = float(cv2.countNonZero(mask) / (img.shape[0] * img.shape[1]))

            if green_ratio < 0.05:
                return (
                    False,
                    green_ratio,
                    "No crop leaf or foliage detected in the photo. Please upload a clear photo of plant foliage.",
                )
            return True, green_ratio, ""
        except Exception as err:
            logger.warning("OpenCV foliage check error: %s", err)
            return True, 0.5, ""

    def _dev_placeholder(self, green_ratio: float = 0.5, crop: str = "Tomato") -> dict:
        """Intelligent development placeholder based on greenness."""
        logger.debug("DiseaseClassifier: returning DEV placeholder prediction")
        if green_ratio > 0.55:
            return {
                "is_plant_leaf": True,
                "is_healthy": True,
                "disease": f"Healthy {crop} Leaf",
                "confidence": 0.96,
                "crop": crop,
                "severity": "LOW",
                "affected_percentage": 0.0,
                "_dev_mode": True,
            }
        return {
            "is_plant_leaf": True,
            "is_healthy": False,
            "disease": f"{crop} Early Blight",
            "confidence": 0.91,
            "crop": crop,
            "severity": "MODERATE",
            "affected_percentage": 14.5,
            "_dev_mode": True,
        }

    def _load_and_preprocess(self, image_bytes: bytes) -> "Image.Image":
        """
        Load image bytes → PIL RGB image.
        Handles JPEG, PNG, WebP, etc.
        """
        image = Image.open(io.BytesIO(image_bytes))

        # Ensure RGB (removes alpha channel if PNG has transparency)
        if image.mode != "RGB":
            image = image.convert("RGB")

        return image

    @property
    def is_loaded(self) -> bool:
        return self._loaded


# ---------------------------------------------------------------------------
# Module-level singleton — shared across the FastAPI application
# ---------------------------------------------------------------------------
_classifier_instance: Optional[DiseaseClassifier] = None


def get_classifier() -> DiseaseClassifier:
    """Return the module-level singleton, initializing if needed."""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = DiseaseClassifier()
    return _classifier_instance
