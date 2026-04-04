import logging
import sys
import os
from logging.handlers import RotatingFileHandler

def setup_logger(name):
    """
    Sets up a structured logger for the AI engine.
    Writes to both console and a rotating log file.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File Handler
    log_file_path = os.path.join(os.path.dirname(__file__), '../logs/ai_engine.log')
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
    
    file_handler = RotatingFileHandler(
        log_file_path, maxBytes=5*1024*1024, backupCount=5
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger

# Singleton instance
ai_logger = setup_logger('wearwise_ai')
