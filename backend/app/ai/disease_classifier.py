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
import logging
import os
from typing import Optional

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

    def predict_disease(self, image_bytes: bytes) -> dict:
        """
        Run disease classification on raw image bytes.

        Args:
            image_bytes: Raw bytes of the uploaded leaf image.

        Returns:
            {
                "disease": str,
                "confidence": float (0-1),
                "crop": str
            }

        Raises:
            ModelNotLoadedError: if not loaded and not in dev mode.
        """
        if not self._loaded:
            if self._dev_mode:
                return self._dev_placeholder()
            raise ModelNotLoadedError(
                "Classifier not loaded. Check MODEL_PATH env var or set DEV_MODE=true."
            )

        import torch
        import torch.nn.functional as F

        # --- Image preprocessing ---
        image = self._load_and_preprocess(image_bytes)

        with torch.no_grad():
            # Add batch dimension: [1, 3, 224, 224]
            tensor = self._transform(image).unsqueeze(0).to(self._device)

            # Forward pass
            logits = self._model(tensor)

            # Softmax → probability distribution over 38 classes
            probabilities = F.softmax(logits, dim=1).squeeze(0)

        # Top-1 prediction
        top_prob, top_idx = probabilities.max(dim=0)
        confidence = float(top_prob.cpu().numpy())
        class_idx = int(top_idx.cpu().numpy())

        crop, disease = PLANTVILLAGE_CLASSES[class_idx]

        logger.info(
            f"DiseaseClassifier: predicted '{disease}' on '{crop}' "
            f"with confidence={confidence:.3f}"
        )

        return {
            "disease": disease,
            "confidence": round(confidence, 4),
            "crop": crop,
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

    def _dev_placeholder(self) -> dict:
        """
        Development-mode placeholder prediction.
        Clearly labelled — never returned silently.
        """
        logger.debug("DiseaseClassifier: returning DEV placeholder prediction")
        return {
            "disease": "Tomato Early Blight",
            "confidence": 0.91,
            "crop": "Tomato",
            "_dev_mode": True,
        }

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
