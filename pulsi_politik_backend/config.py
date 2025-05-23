# pulsi_politik_backend/config.py
import os
from dotenv import load_dotenv # For loading .env files (optional but common)

# Determine the base directory of the application
# This assumes config.py is in the root of your backend package (pulsi_politik_backend)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load environment variables from a .env file if it exists
# Create a .env file in the same directory as this config.py for sensitive or environment-specific settings
# Example .env file:
# FLASK_DEBUG=True
# SECRET_KEY=my_super_secret_flask_key
# DB_PATH=instance/myapp_data.db
dotenv_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

class Config:
    # --- Essential Flask Configurations ---
    # SECRET_KEY is crucial for session management, flash messages, and cryptographic signing.
    # It's highly recommended to set this from an environment variable in production.
    SECRET_KEY = os.getenv("SECRET_KEY", "a_very_strong_default_secret_key_that_should_be_changed")

    # FLASK_DEBUG enables/disables debug mode.
    # In debug mode, Flask provides a debugger and reloads on code changes.
    # NEVER run with debug mode enabled in production.
    DEBUG = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")

    # --- Database Configuration ---
    # DB_PATH: Path to your SQLite database file.
    # If DB_PATH is just a filename (e.g., "kcm_data.db"), it will be relative to BASE_DIR
    # (i.e., pulsi_politik_backend/kcm_data.db).
    # If you want it in an 'instance' folder (common Flask practice for DBs not in version control):
    # DB_PATH = os.getenv("DB_PATH", os.path.join(BASE_DIR, 'instance', 'kcm_data.db'))
    # Ensure the 'instance' folder exists if you use this.
    DB_PATH_SETTING = os.getenv("DB_PATH", "kcm_data.db")
    if not os.path.isabs(DB_PATH_SETTING):
        DB_PATH = os.path.join(BASE_DIR, DB_PATH_SETTING)
    else:
        DB_PATH = DB_PATH_SETTING
    
    # --- Application Specific Configurations (Examples) ---
    # API_VERSION = "v1"
    # ITEMS_PER_PAGE = 10

    # --- Cache Configuration (Example if you add caching later) ---
    # CACHE_TYPE = "SimpleCache"  # Flask-Caching type
    # CACHE_DEFAULT_TIMEOUT = 300 # Seconds

# You might also have different configurations for different environments
# class DevelopmentConfig(Config):
#     DEBUG = True
#     # SQLALCHEMY_ECHO = True # If using SQLAlchemy

# class TestingConfig(Config):
#     TESTING = True
#     DB_PATH = os.path.join(BASE_DIR, 'instance', 'test_kcm_data.db') # Use a separate test DB
#     SECRET_KEY = "test_secret_key"

# class ProductionConfig(Config):
#     DEBUG = False
#     # More secure settings, e.g., load secret key from a secure vault