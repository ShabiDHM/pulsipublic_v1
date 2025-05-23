# pulsi_politik_backend/app.py

import os
import datetime
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

ministry_repo = None
ministry_service = None

try:
    db_path_from_config = app.config.get('DB_PATH')
    if db_path_from_config:
        ministry_repo = MinistryRepository(db_path=db_path_from_config)
        ministry_service = MinistryService(ministry_repo=ministry_repo)
        print(f"✅ MinistryRepository and MinistryService initialized with DB path: {db_path_from_config}")
    else:
        # Fallback or error if DB_PATH is not in config, though your previous logs showed it was.
        # This path is for robustness.
        default_db_path = os.path.join(os.path.dirname(__file__), 'kcm_data.db') # Example default
        print(f"⚠️ WARNING: DB_PATH not found in app.config. Attempting to use default path: {default_db_path}")
        print(f"   Ensure 'DB_PATH' is set in your 'config.py' for reliable operation.")
        if not os.path.exists(os.path.dirname(default_db_path)) and os.path.dirname(default_db_path):
             os.makedirs(os.path.dirname(default_db_path), exist_ok=True)

        ministry_repo = MinistryRepository(db_path=default_db_path) # Use default if not configured
        ministry_service = MinistryService(ministry_repo=ministry_repo)
        print(f"✅ MinistryRepository and MinistryService initialized using FALLBACK DB path: {default_db_path}")

except Exception as e:
    print(f"⚠️ CRITICAL ERROR during repository or service initialization: {e}")
    print(f"   The application might not function correctly. Check database configuration and paths.")


def check_database_health() -> Optional[str]:
    required_tables = {'ministries', 'ministry_indicators', 'ministry_kpis', 'ministry_activities'}
    # Determine DB path: either from config or the one used by the repo if config was missing
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
        existing_tables = {row[0].lower() for row in cursor.fetchall()} # Ensure case-insensitivity for check
        missing_tables = [t for t in required_tables if t.lower() not in existing_tables] # Compare lowercased
        if missing_tables:
            return f"Missing required tables: {', '.join(missing_tables)} in DB: {db_path_to_check}"
        
        # Optional: Check if ministries table has data (uncomment if needed, but init-db should handle population)
        # cursor.execute("SELECT COUNT(*) FROM ministries;")
        # if cursor.fetchone()[0] == 0:
        #     return "Database tables exist but 'ministries' table is empty. Consider running 'flask init-db' to populate."
        return None # All good
    except Exception as e:
        return f"Database connection/health check failed for {db_path_to_check}: {str(e)}"
    finally:
        if 'conn' in locals() and conn:
            conn.close()

DATABASE_STATUS = check_database_health()
if DATABASE_STATUS:
    print(f"⚠️ DATABASE WARNING (on app start): {DATABASE_STATUS}")
    print("   API routes requiring database access may not work properly.")
    print("   Consider running 'flask init-db' if tables are missing or DB file not found.")
else:
    print("✅ Database connection and schema verified (on app start).")

@app.cli.command("init-db")
def init_db_command():
    try:
        # Use the db_path the repository was initialized with, or config, or a default
        db_path_to_use = ministry_repo.db_path if ministry_repo else app.config.get('DB_PATH')
        if not db_path_to_use:
            print("⚠️ ERROR: DB_PATH not determined. Cannot initialize database.")
            return

        print(f"--- Attempting init-db for: {db_path_to_use} ---")
        db_dir = os.path.dirname(db_path_to_use)
        if db_dir and not os.path.exists(db_dir):
            print(f"Creating database directory: {db_dir}")
            os.makedirs(db_dir, exist_ok=True)

        init_db_function(db_path=db_path_to_use)
        print("--- DB schema initialized. Populating... ---")
        populate_db_function(db_path=db_path_to_use)
        print("--- Database populated with initial data. ---")
        print("✅ --- Database setup complete! --- ✅")
    except Exception as e:
        print(f"⚠️ An error occurred during 'flask init-db': {e}")
        import traceback
        traceback.print_exc()

# Static file serving logic (seems okay from your logs, but double-check paths if issues arise)
# app.root_path is pulsi_politik_backend
LOCAL_STATIC_DIR = os.path.abspath(os.path.join(app.root_path, '..', 'pulsi_politik_frontend'))
DOCKER_STATIC_DIR = '/app/docs' # Fallback for Docker, if you use it

if os.path.exists(LOCAL_STATIC_DIR) and os.path.isdir(LOCAL_STATIC_DIR):
    EFFECTIVE_STATIC_FOLDER = LOCAL_STATIC_DIR
    print(f"ℹ️ Serving frontend files from local static folder: {EFFECTIVE_STATIC_FOLDER}")
else:
    EFFECTIVE_STATIC_FOLDER = DOCKER_STATIC_DIR
    print(f"ℹ️ Local static folder not found at '{LOCAL_STATIC_DIR}'. Attempting to use Docker path: '{DOCKER_STATIC_DIR}'.")
    if not (os.path.exists(EFFECTIVE_STATIC_FOLDER) and os.path.isdir(EFFECTIVE_STATIC_FOLDER)):
         print(f"⚠️ CRITICAL WARNING: Neither local nor Docker static folder found. Frontend will not be served.")
         EFFECTIVE_STATIC_FOLDER = None # Explicitly set to None if no path is valid


@app.route('/')
def serve_index():
    if not EFFECTIVE_STATIC_FOLDER:
        return "Static file serving is not configured correctly: No valid static folder found.", 500
    index_file_path = os.path.join(EFFECTIVE_STATIC_FOLDER, 'index.html')
    if not os.path.exists(index_file_path):
        return f"Frontend 'index.html' not found. Checked path: '{index_file_path}'. Ensure frontend is built or path is correct.", 404
    return send_from_directory(EFFECTIVE_STATIC_FOLDER, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename: str):
    if not EFFECTIVE_STATIC_FOLDER:
        return "Static file serving is not configured correctly: No valid static folder found.", 500
    if '..' in filename or filename.startswith('/'): # Basic security check
        return "Invalid file path.", 400
    return send_from_directory(EFFECTIVE_STATIC_FOLDER, filename)

# --- API Endpoints ---
@app.route('/api/dashboard_data', methods=['GET'])
def get_dashboard_data():
    if not ministry_service:
        app.logger.error("Ministry service not available for /api/dashboard_data")
        return jsonify({"error": "Application service not properly initialized."}), 503

    pillar = request.args.get('pillar', 'Transparency').capitalize()
    lang = request.args.get('lang', 'en')
    period_code = request.args.get('period', 'q2-2023') # Default period

    if lang not in ['en', 'sq', 'sr']:
        lang = 'en' # Default to English if invalid lang
    
    try:
        dashboard_data = ministry_service.get_formatted_dashboard_data(
            pillar=pillar,
            lang=lang,
            period_code=period_code
        )
        # No need to raise NotFoundError if ministries list is empty, service handles structure
        return jsonify(dashboard_data)

    except NotFoundError as e: # Should be caught by registered error handler
        app.logger.warning(f"NotFoundError in /api/dashboard_data: {str(e)}")
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in /api/dashboard_data for pillar '{pillar}', period '{period_code}': {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred processing dashboard data."}), 500

@app.route('/api/ministry_details/<int:ministry_id>', methods=['GET'])
def get_ministry_details(ministry_id: int):
    if not ministry_service:
        app.logger.error(f"Ministry service not available for /api/ministry_details/{ministry_id}")
        return jsonify({"error": "Application service not properly initialized."}), 503

    lang = request.args.get('lang', 'en')
    if lang not in ['en', 'sq', 'sr']:
        lang = 'en'

    # --- MODIFIED SECTION TO GET PERIOD ---
    period_code = request.args.get('period') # Get 'period' from query string
    if not period_code:
        # Fallback if frontend doesn't send it.
        # Ideally, the frontend always includes the 'period' for this request,
        # matching the period selected on the main dashboard.
        default_period_for_details = 'q2-2023' # Consider making this configurable or more dynamic
        app.logger.warning(
            f"No 'period' query parameter received for /api/ministry_details/{ministry_id}. "
            f"Defaulting to '{default_period_for_details}'. Frontend should ideally send this."
        )
        period_code = default_period_for_details
    # --- END OF MODIFIED SECTION ---

    try:
        formatted_details = ministry_service.get_formatted_ministry_details(
            ministry_id=ministry_id,
            lang=lang,
            current_period_code=period_code # Pass the determined period_code
        )

        if not formatted_details or not formatted_details.get("profile"): # Check if service returned valid data
            # The service method get_formatted_ministry_details now returns None if profile not found.
            # Or it might return a structure where profile is empty.
            raise NotFoundError(message=f"Ministry with ID {ministry_id} not found or details could not be constructed.")
        
        return jsonify(formatted_details)

    except NotFoundError as e: # Re-raise to be handled by the app's registered error handler
        app.logger.warning(f"NotFoundError in /api/ministry_details for ID {ministry_id}: {str(e)}")
        raise
    except Exception as e:
        app.logger.error(f"Unexpected error in /api/ministry_details for ID {ministry_id}: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred processing ministry details."}), 500

if __name__ == '__main__':
    # When running with `python app.py`, debug mode will be based on Config.DEBUG
    # When running with `flask run`, it uses its own mechanisms (FLASK_DEBUG=1 or --debug)
    app.run(host=app.config.get("HOST", "0.0.0.0"),
            port=app.config.get("PORT", 5000),
            debug=app.config.get("DEBUG", False))