import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Centralized configuration for the AI Engine."""
    
    ENVIRONMENT = os.getenv('ENV', 'development')
    MODEL_PATH = os.getenv('MODEL_PATH', './models/binary_clothing_model.h5')
    
    # Model Thresholds
    CONFIDENCE_THRESHOLD = 0.8
    IMAGE_SIZE = (224, 224)
    
    # API Settings
    PORT = int(os.getenv('AI_PORT', 5001))
    DEBUG = ENVIRONMENT == 'development'

config = Config()
