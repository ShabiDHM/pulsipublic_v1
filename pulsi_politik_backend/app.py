# pulsi_politik_backend/app.py

import os
import datetime
import logging # Added for explicit import, good practice
from typing import Optional, Dict, List, Any
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# Assuming these imports are correct for your project structure
from .config import Config
from .database.repositories import (
    MinistryRepository,
    init_db as init_db_function,
    populate_all_ministry_data as populate_db_function
)
from .services.ministry_service import MinistryService
from .errors.handlers import register_error_handlers
from .errors.exceptions import NotFoundError, BadRequestError # Ensure these are correctly defined
from .middleware.security import SecurityHeadersMiddleware # Ensure this is correctly defined

app = Flask(__name__)
CORS(app) # Enable CORS for all routes
app.wsgi_app = SecurityHeadersMiddleware(app.wsgi_app) # Apply security headers
app.config.from_object(Config) # Load configuration
register_error_handlers(app) # Register custom error handlers

# Configure Flask's logger for more detailed output if needed.
# By default, INFO and above are usually logged. For DEBUG:
# if app.debug: # Only set DEBUG level if Flask debug mode is on
#     app.logger.setLevel(logging.DEBUG)
# else:
#     app.logger.setLevel(logging.INFO)
# Or you can set it directly:
# app.logger.setLevel(logging.INFO) # Ensures INFO and above are logged

ministry_repo = None
ministry_service = None

try:
    db_path_from_config = app.config.get('DB_PATH')
    if db_path_from_config:
        ministry_repo = MinistryRepository(db_path=db_path_from_config)
        ministry_service = MinistryService(ministry_repo=ministry_repo)
        app.logger.info(f"✅ MinistryRepository and MinistryService initialized with DB path: {db_path_from_config}") # Using app.logger
    else:
        default_db_path = os.path.join(os.path.dirname(__file__), 'kcm_data.db')
        app.logger.warning(f"⚠️ WARNING: DB_PATH not found in app.config. Attempting to use default path: {default_db_path}") # Using app.logger
        app.logger.warning(f"   Ensure 'DB_PATH' is set in your 'config.py' for reliable operation.") # Using app.logger
        if not os.path.exists(os.path.dirname(default_db_path)) and os.path.dirname(default_db_path):
             os.makedirs(os.path.dirname(default_db_path), exist_ok=True)

        ministry_repo = MinistryRepository(db_path=default_db_path)
        ministry_service = MinistryService(ministry_repo=ministry_repo)
        app.logger.info(f"✅ MinistryRepository and MinistryService initialized using FALLBACK DB path: {default_db_path}") # Using app.logger

except Exception as e:
    app.logger.critical(f"⚠️ CRITICAL ERROR during repository or service initialization: {e}", exc_info=True) # Using app.logger, added exc_info
    app.logger.critical(f"   The application might not function correctly. Check database configuration and paths.") # Using app.logger


def check_database_health() -> Optional[str]:
    required_tables = {'ministries', 'ministry_indicators', 'ministry_kpis', 'ministry_activities'}
    db_path_to_check = ministry_repo.db_path if ministry_repo else app.config.get('DB_PATH')

    if not db_path_to_check:
        return "DB_PATH not configured and repository not initialized with a path."
    if not os.path.exists(db_path_to_check):
        return f"Database file not found at path: {db_path_to_check}. Run 'flask init-db'."
    try:
        import sqlite3
        conn = sqlite3.connect(db_path_to_check)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        existing_tables = {row[0].lower() for row in cursor.fetchall()}
        missing_tables = [t for t in required_tables if t.lower() not in existing_tables]
        if missing_tables:
            return f"Missing required tables: {', '.join(missing_tables)} in DB: {db_path_to_check}"
        return None
    except Exception as e:
        return f"Database connection/health check failed for {db_path_to_check}: {str(e)}"
    finally:
        if 'conn' in locals() and conn:
            conn.close()

DATABASE_STATUS = check_database_health()
if DATABASE_STATUS:
    app.logger.warning(f"⚠️ DATABASE WARNING (on app start): {DATABASE_STATUS}") # Using app.logger
    app.logger.warning("   API routes requiring database access may not work properly.") # Using app.logger
    app.logger.warning("   Consider running 'flask init-db' if tables are missing or DB file not found.") # Using app.logger
else:
    app.logger.info("✅ Database connection and schema verified (on app start).") # Using app.logger

@app.cli.command("init-db")
def init_db_command():
    try:
        db_path_to_use = ministry_repo.db_path if ministry_repo else app.config.get('DB_PATH')
        if not db_path_to_use:
            app.logger.error("⚠️ ERROR: DB_PATH not determined. Cannot initialize database.") # Using app.logger
            return

        app.logger.info(f"--- Attempting init-db for: {db_path_to_use} ---") # Using app.logger
        db_dir = os.path.dirname(db_path_to_use)
        if db_dir and not os.path.exists(db_dir):
            app.logger.info(f"Creating database directory: {db_dir}") # Using app.logger
            os.makedirs(db_dir, exist_ok=True)

        init_db_function(db_path=db_path_to_use)
        app.logger.info("--- DB schema initialized. Populating... ---") # Using app.logger
        populate_db_function(db_path=db_path_to_use)
        app.logger.info("--- Database populated with initial data. ---") # Using app.logger
        app.logger.info("✅ --- Database setup complete! --- ✅") # Using app.logger
    except Exception as e:
        app.logger.error(f"⚠️ An error occurred during 'flask init-db': {e}", exc_info=True) # Using app.logger, added exc_info
        import traceback
        traceback.print_exc() # Still good for CLI command context

LOCAL_STATIC_DIR = os.path.abspath(os.path.join(app.root_path, '..', 'pulsi_politik_frontend'))
DOCKER_STATIC_DIR = '/app/docs'

if os.path.exists(LOCAL_STATIC_DIR) and os.path.isdir(LOCAL_STATIC_DIR):
    EFFECTIVE_STATIC_FOLDER = LOCAL_STATIC_DIR
    app.logger.info(f"ℹ️ Serving frontend files from local static folder: {EFFECTIVE_STATIC_FOLDER}") # Using app.logger
else:
    EFFECTIVE_STATIC_FOLDER = DOCKER_STATIC_DIR
    app.logger.info(f"ℹ️ Local static folder not found at '{LOCAL_STATIC_DIR}'. Attempting to use Docker path: '{DOCKER_STATIC_DIR}'.") # Using app.logger
    if not (os.path.exists(EFFECTIVE_STATIC_FOLDER) and os.path.isdir(EFFECTIVE_STATIC_FOLDER)):
         app.logger.critical(f"⚠️ CRITICAL WARNING: Neither local nor Docker static folder found. Frontend will not be served.") # Using app.logger
         EFFECTIVE_STATIC_FOLDER = None


@app.route('/')
def serve_index():
    if not EFFECTIVE_STATIC_FOLDER:
        app.logger.error("Static file serving is not configured correctly: No valid static folder found.")
        return "Static file serving is not configured correctly: No valid static folder found.", 500
    index_file_path = os.path.join(EFFECTIVE_STATIC_FOLDER, 'index.html')
    if not os.path.exists(index_file_path):
        app.logger.error(f"Frontend 'index.html' not found. Checked path: '{index_file_path}'. Ensure frontend is built or path is correct.")
        return f"Frontend 'index.html' not found. Checked path: '{index_file_path}'. Ensure frontend is built or path is correct.", 404
    return send_from_directory(EFFECTIVE_STATIC_FOLDER, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename: str):
    if not EFFECTIVE_STATIC_FOLDER:
        app.logger.error("Static file serving is not configured correctly: No valid static folder found for filename.")
        return "Static file serving is not configured correctly: No valid static folder found.", 500
    if '..' in filename or filename.startswith('/'):
        app.logger.warning(f"Invalid file path requested in serve_static: {filename}")
        return "Invalid file path.", 400
    return send_from_directory(EFFECTIVE_STATIC_FOLDER, filename)

# --- API Endpoints ---
@app.route('/api/dashboard_data', methods=['GET'])
def get_dashboard_data():
    app.logger.info(f"--- Request received for /api/dashboard_data ---") # LOG ADDED

    if not ministry_service:
        app.logger.error("Ministry service not available for /api/dashboard_data")
        return jsonify({"error": "Application service not properly initialized."}), 503

    pillar = request.args.get('pillar', 'Transparency').capitalize()
    lang = request.args.get('lang', 'en')
    period_code = request.args.get('period', 'q2-2023')

    app.logger.info(f"Parameters for dashboard_data: pillar='{pillar}', lang='{lang}', period_code='{period_code}'") # LOG ADDED

    if lang not in ['en', 'sq', 'sr']:
        app.logger.warning(f"Invalid lang '{lang}' received for dashboard_data, defaulting to 'en'.") # LOG MODIFIED
        lang = 'en'
    
    try:
        app.logger.info(f"Calling ministry_service.get_formatted_dashboard_data with pillar={pillar}, lang={lang}, period={period_code}") # LOG ADDED
        dashboard_data = ministry_service.get_formatted_dashboard_data(
            pillar=pillar,
            lang=lang,
            period_code=period_code
        )
        app.logger.info(f"ministry_service.get_formatted_dashboard_data returned. Type: {type(dashboard_data)}") # LOG ADDED
        
        if isinstance(dashboard_data, dict):
            # Log structure carefully; avoid logging huge amounts of data
            app.logger.debug(f"Dashboard data keys: {list(dashboard_data.keys())}")
            if 'ministries' in dashboard_data and isinstance(dashboard_data['ministries'], list):
               app.logger.info(f"Number of ministries in dashboard_data: {len(dashboard_data['ministries'])}")
               if len(dashboard_data['ministries']) > 0:
                   app.logger.debug(f"First ministry in dashboard_data (keys): {list(dashboard_data['ministries'][0].keys()) if isinstance(dashboard_data['ministries'][0], dict) else 'Not a dict'}")
            else:
               app.logger.warning(f"'ministries' key not found or not a list in dashboard_data.")
        elif dashboard_data is None:
            app.logger.warning("ministry_service.get_formatted_dashboard_data returned None.")
        else:
            app.logger.info(f"ministry_service.get_formatted_dashboard_data returned non-dict, non-None data: {str(dashboard_data)[:200]}") # Log snippet

        return jsonify(dashboard_data)

    except NotFoundError as e:
        app.logger.warning(f"NotFoundError in /api/dashboard_data: {str(e)}")
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in /api/dashboard_data for pillar '{pillar}', period '{period_code}': {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred processing dashboard data."}), 500

@app.route('/api/ministry_details/<int:ministry_id>', methods=['GET'])
def get_ministry_details(ministry_id: int):
    app.logger.info(f"--- Request received for /api/ministry_details/{ministry_id} ---") # LOG ADDED
    if not ministry_service:
        app.logger.error(f"Ministry service not available for /api/ministry_details/{ministry_id}")
        return jsonify({"error": "Application service not properly initialized."}), 503

    lang = request.args.get('lang', 'en')
    if lang not in ['en', 'sq', 'sr']:
        app.logger.warning(f"Invalid lang '{lang}' received for ministry_details/{ministry_id}, defaulting to 'en'.") # LOG MODIFIED
        lang = 'en'

    period_code = request.args.get('period')
    app.logger.info(f"Parameters for ministry_details: ministry_id={ministry_id}, lang='{lang}', period_code='{period_code}'") # LOG ADDED

    if not period_code:
        default_period_for_details = 'q2-2023'
        app.logger.warning(
            f"No 'period' query parameter received for /api/ministry_details/{ministry_id}. "
            f"Defaulting to '{default_period_for_details}'. Frontend should ideally send this."
        )
        period_code = default_period_for_details
    
    try:
        app.logger.info(f"Calling ministry_service.get_formatted_ministry_details for id={ministry_id}, lang={lang}, period={period_code}") # LOG ADDED
        formatted_details = ministry_service.get_formatted_ministry_details(
            ministry_id=ministry_id,
            lang=lang,
            current_period_code=period_code
        )
        app.logger.info(f"ministry_service.get_formatted_ministry_details returned. Type: {type(formatted_details)}") # LOG ADDED

        if not formatted_details or not formatted_details.get("profile"):
            app.logger.warning(f"Ministry with ID {ministry_id} not found by service or details structure invalid. Raising NotFoundError.") # LOG ADDED
            raise NotFoundError(message=f"Ministry with ID {ministry_id} not found or details could not be constructed.")
        
        return jsonify(formatted_details)

    except NotFoundError as e:
        app.logger.warning(f"NotFoundError in /api/ministry_details for ID {ministry_id}: {str(e)}")
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in /api/ministry_details for ID {ministry_id}: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred processing ministry details."}), 500

if __name__ == '__main__':
    app.run(host=app.config.get("HOST", "0.0.0.0"),
            port=app.config.get("PORT", 5000),
            debug=app.config.get("DEBUG", False))