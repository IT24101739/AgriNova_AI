"""
Disease Severity Estimator — AI Part 2

Method: HSV-based computer vision (OpenCV)
  1. Convert image to HSV color space
  2. Isolate the leaf area using green channel mask
  3. Detect lesion pixels (brown / yellow / dark regions)
  4. Compute affected_percentage = lesion_pixels / leaf_pixels * 100
  5. Map to LOW / MODERATE / HIGH severity

Severity thresholds (aligned with specification):
  0-10%   → LOW
  10-35%  → MODERATE
  >35%    → HIGH

This module is designed to be replaced by an ML segmentation model
(e.g. U-Net) without changing the public interface.

Usage:
    estimator = SeverityEstimator()
    result = estimator.estimate_severity(image_bytes)
"""

import io
import logging
from typing import Optional

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Severity thresholds (match specification)
# ---------------------------------------------------------------------------
SEVERITY_THRESHOLDS = {
    "LOW": (0.0, 10.0),
    "MODERATE": (10.0, 35.0),
    "HIGH": (35.0, 100.0),
}


class SeverityEstimator:
    """
    HSV-based leaf disease severity estimator.
    Public interface matches future ML segmentation model contract.
    """

    # HSV range for healthy green leaf pixels
    # H: 35-85° (green hues), S: >40, V: >40
    LEAF_HUE_LOW = np.array([35, 40, 40], dtype=np.uint8)
    LEAF_HUE_HIGH = np.array([85, 255, 255], dtype=np.uint8)

    # HSV ranges for disease lesions:
    # Brown/necrotic tissue
    LESION_BROWN_LOW = np.array([5, 40, 30], dtype=np.uint8)
    LESION_BROWN_HIGH = np.array([25, 255, 200], dtype=np.uint8)

    # Yellow/chlorotic tissue
    LESION_YELLOW_LOW = np.array([20, 50, 150], dtype=np.uint8)
    LESION_YELLOW_HIGH = np.array([35, 255, 255], dtype=np.uint8)

    # Dark necrotic spots (very low value)
    LESION_DARK_LOW = np.array([0, 0, 0], dtype=np.uint8)
    LESION_DARK_HIGH = np.array([180, 255, 50], dtype=np.uint8)

    def estimate_severity(self, image_bytes: bytes) -> dict:
        """
        Estimate disease severity from raw leaf image bytes.

        Args:
            image_bytes: Raw bytes of the uploaded leaf image.

        Returns:
            {
                "severity": "LOW" | "MODERATE" | "HIGH",
                "affected_percentage": float,
                "confidence": float (0-1),
            }
        """
        try:
            import cv2

            # --- Load image ---
            image_array = self._load_image(image_bytes)

            # --- Convert to HSV ---
            hsv = cv2.cvtColor(image_array, cv2.COLOR_RGB2HSV)

            # --- Leaf mask: isolate green leaf area ---
            leaf_mask = cv2.inRange(hsv, self.LEAF_HUE_LOW, self.LEAF_HUE_HIGH)

            # Dilate leaf mask slightly to capture leaf edges
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            leaf_mask = cv2.dilate(leaf_mask, kernel, iterations=2)

            leaf_pixel_count = int(np.sum(leaf_mask > 0))

            if leaf_pixel_count < 100:
                # Not enough leaf detected — fallback to whole image
                logger.warning("SeverityEstimator: low leaf pixel count, using full image")
                leaf_mask = np.ones(hsv.shape[:2], dtype=np.uint8) * 255
                leaf_pixel_count = int(leaf_mask.size)

            # --- Lesion masks ---
            lesion_brown = cv2.inRange(hsv, self.LESION_BROWN_LOW, self.LESION_BROWN_HIGH)
            lesion_yellow = cv2.inRange(hsv, self.LESION_YELLOW_LOW, self.LESION_YELLOW_HIGH)
            lesion_dark = cv2.inRange(hsv, self.LESION_DARK_LOW, self.LESION_DARK_HIGH)

            # Combine all lesion masks
            all_lesions = cv2.bitwise_or(lesion_brown, lesion_yellow)
            all_lesions = cv2.bitwise_or(all_lesions, lesion_dark)

            # Only count lesions that overlap with leaf area
            lesion_on_leaf = cv2.bitwise_and(all_lesions, all_lesions, mask=leaf_mask)

            # Morphological cleanup — remove noise
            lesion_on_leaf = cv2.morphologyEx(lesion_on_leaf, cv2.MORPH_OPEN, kernel)

            lesion_pixel_count = int(np.sum(lesion_on_leaf > 0))

            # --- Compute affected percentage ---
            affected_pct = min(
                (lesion_pixel_count / leaf_pixel_count) * 100.0, 100.0
            )
            affected_pct = round(float(affected_pct), 2)

            # --- Map to severity label ---
            severity = self._classify_severity(affected_pct)

            # --- Compute confidence ---
            # Higher confidence when leaf mask covers significant area
            leaf_coverage = leaf_pixel_count / (image_array.shape[0] * image_array.shape[1])
            confidence = round(min(0.95, 0.60 + leaf_coverage * 0.35), 2)

            logger.info(
                f"SeverityEstimator: {severity} | "
                f"affected={affected_pct:.1f}% | "
                f"leaf_pixels={leaf_pixel_count} | "
                f"lesion_pixels={lesion_pixel_count} | "
                f"confidence={confidence}"
            )

            return {
                "severity": severity,
                "affected_percentage": affected_pct,
                "confidence": confidence,
            }

        except Exception as e:
            logger.error(f"SeverityEstimator error: {e}", exc_info=True)
            # Return a safe fallback so the pipeline doesn't break
            return {
                "severity": "MODERATE",
                "affected_percentage": 0.0,
                "confidence": 0.0,
                "_error": str(e),
            }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _load_image(self, image_bytes: bytes) -> np.ndarray:
        """Load image bytes → numpy RGB array."""
        pil_image = Image.open(io.BytesIO(image_bytes))
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")
        # Resize large images for performance (max 640px wide)
        max_dim = 640
        w, h = pil_image.size
        if w > max_dim or h > max_dim:
            scale = max_dim / max(w, h)
            # Pillow 10+ uses Image.Resampling.LANCZOS; fallback for older Pillow
            _lanczos = getattr(Image, "Resampling", Image).LANCZOS
            pil_image = pil_image.resize(
                (int(w * scale), int(h * scale)), _lanczos
            )
        return np.array(pil_image, dtype=np.uint8)

    @staticmethod
    def _classify_severity(affected_pct: float) -> str:
        """Map affected_percentage to LOW / MODERATE / HIGH."""
        if affected_pct <= 10.0:
            return "LOW"
        elif affected_pct <= 35.0:
            return "MODERATE"
        else:
            return "HIGH"


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
_estimator_instance: Optional[SeverityEstimator] = None


def get_estimator() -> SeverityEstimator:
    """Return the module-level singleton."""
    global _estimator_instance
    if _estimator_instance is None:
        _estimator_instance = SeverityEstimator()
    return _estimator_instance
