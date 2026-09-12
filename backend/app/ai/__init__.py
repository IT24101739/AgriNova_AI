"""
AI package — exposes classifier and estimator singletons.
Import these in services/report_service.py.
"""

from app.ai.disease_classifier import DiseaseClassifier, get_classifier, ModelNotLoadedError
from app.ai.severity_estimator import SeverityEstimator, get_estimator

__all__ = [
    "DiseaseClassifier",
    "get_classifier",
    "ModelNotLoadedError",
    "SeverityEstimator",
    "get_estimator",
]
