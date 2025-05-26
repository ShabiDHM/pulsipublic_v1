# pulsi_politik_backend/app.py

import os
import datetime
import logging
from typing import Optional, Dict, List, Any
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
import sqlite3

from .config import Config
from .database.repositories import (
    MinistryRepository,
    init_db as init_db_function,
    populate_all_ministry_data as populate_db_function
)
from .services.ministry_service import MinistryService
from .errors.handlers import register_error_handlers
from .errors.exceptions import NotFoundError, BadRequestError
from .middleware.security import SecurityHeadersMiddleware

# --- Flask App Initialization ---
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(__name__,
            template_folder=os.path.join(PROJECT_ROOT, 'pulsi_politik_frontend'),
            static_folder=os.path.join(PROJECT_ROOT, 'static'),
            static_url_path='/static')

CORS(app)
app.wsgi_app = SecurityHeadersMiddleware(app.wsgi_app)
app.config.from_object(Config)
register_error_handlers(app)

app.logger.setLevel(logging.INFO)

ministry_repo = None
ministry_service = None

try:
    db_path_from_config = app.config.get('DB_PATH')
    if db_path_from_config:
        if not os.path.isabs(db_path_from_config):
            db_path_from_config = os.path.join(PROJECT_ROOT, db_path_from_config)
        ministry_repo = MinistryRepository(db_path=db_path_from_config)
        ministry_service = MinistryService(ministry_repo=ministry_repo)
        app.logger.info(f"✅ MinistryRepository and MinistryService initialized with DB path from config: {db_path_from_config}")
    else:
        default_db_path = os.path.join(PROJECT_ROOT, 'pulsi_politik_backend', 'kcm_data.db')
        app.logger.warning(f"⚠️ WARNING: DB_PATH not found in app.config. Attempting to use default path: {default_db_path}")
        app.logger.warning(f"   Ensure 'DB_PATH' is set in your 'config.py' for reliable operation.")
        db_dir_default = os.path.dirname(default_db_path)
        if db_dir_default and not os.path.exists(db_dir_default):
             os.makedirs(db_dir_default, exist_ok=True)
        ministry_repo = MinistryRepository(db_path=default_db_path)
        ministry_service = MinistryService(ministry_repo=ministry_repo)
        app.logger.info(f"✅ MinistryRepository and MinistryService initialized using FALLBACK DB path: {default_db_path}")

except Exception as e:
    app.logger.critical(f"⚠️ CRITICAL ERROR during repository or service initialization: {e}", exc_info=True)
    app.logger.critical(f"   The application might not function correctly. Check database configuration and paths.")

def check_database_health() -> Optional[str]:
    required_tables = {'ministries', 'ministry_indicators', 'ministry_kpis', 'ministry_activities'}
    db_path_to_check = None
    if ministry_repo and ministry_repo.db_path:
        db_path_to_check = ministry_repo.db_path
    elif app.config.get('DB_PATH'):
        db_path_to_check = app.config.get('DB_PATH')
        if not os.path.isabs(db_path_to_check):
            db_path_to_check = os.path.join(PROJECT_ROOT, db_path_to_check)
    else:
        db_path_to_check = os.path.join(PROJECT_ROOT, 'pulsi_politik_backend', 'kcm_data.db')
        app.logger.warning(f"DB path for health check fell back to default: {db_path_to_check}")

    if not db_path_to_check:
        return "DB_PATH not configured and repository not initialized with a path for health check."
    if not os.path.exists(db_path_to_check):
        return f"Database file not found at path: {db_path_to_check}. Run 'flask init-db'."
    
    conn = None
    try:
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
        if conn:
            conn.close()

if ministry_repo:
    DATABASE_STATUS = check_database_health()
    if DATABASE_STATUS:
        app.logger.warning(f"⚠️ DATABASE WARNING (on app start): {DATABASE_STATUS}")
        app.logger.warning("   API routes requiring database access may not work properly.")
        app.logger.warning("   Consider running 'flask init-db' if tables are missing or DB file not found.")
    else:
        app.logger.info("✅ Database connection and schema verified (on app start).")
else:
    app.logger.error("ministry_repo not initialized, skipping database health check on app start.")


@app.cli.command("init-db")
def init_db_command():
    try:
        db_path_to_use = None
        if ministry_repo and ministry_repo.db_path:
            db_path_to_use = ministry_repo.db_path
        elif app.config.get('DB_PATH'):
            db_path_to_use = app.config.get('DB_PATH')
            if not os.path.isabs(db_path_to_use):
                db_path_to_use = os.path.join(PROJECT_ROOT, db_path_to_use)
        else:
            db_path_to_use = os.path.join(PROJECT_ROOT, 'pulsi_politik_backend', 'kcm_data.db')
            app.logger.warning(f"DB_PATH for init-db not set, using calculated default: {db_path_to_use}")

        app.logger.info(f"--- Attempting init-db for: {db_path_to_use} ---")
        db_dir = os.path.dirname(db_path_to_use)
        if db_dir and not os.path.exists(db_dir):
            app.logger.info(f"Creating database directory: {db_dir}")
            os.makedirs(db_dir, exist_ok=True)

        init_db_function(db_path=db_path_to_use)
        app.logger.info("--- DB schema initialized. Populating... ---")
        populate_db_function(db_path=db_path_to_use)
        app.logger.info("--- Database populated with initial data. ---")
        app.logger.info("✅ --- Database setup complete! --- ✅")
    except Exception as e:
        app.logger.error(f"⚠️ An error occurred during 'flask init-db': {e}", exc_info=True)
        import traceback
        traceback.print_exc()

# --- Routes for Serving Frontend HTML Files ---
@app.route('/')
@app.route('/index.html')
def serve_index():
    return render_template('index.html')

@app.route('/<page_name>.html')
def serve_page(page_name):
    # Basic security: ensure page_name is from a safe list of known HTML files
    safe_html_pages = ["documents", "events", "local_government", "export_data"] # CORRECTED LIST
    if page_name in safe_html_pages:
        return render_template(f'{page_name}.html')
    app.logger.warning(f"Attempt to access non-whitelisted HTML page: {page_name}.html")
    return "Page not found", 404

@app.route('/<filename>')
def serve_frontend_asset(filename):
    allowed_assets = ["style.css", "main_script.js"] 
    if filename in allowed_assets:
        return send_from_directory(app.template_folder, filename)
    app.logger.warning(f"Attempt to access asset not explicitly allowed or handled: {filename}")
    return "File not found", 404


# --- API Endpoints ---
@app.route('/api/dashboard_data', methods=['GET'])
def get_dashboard_data():
    app.logger.info(f"--- Request received for /api/dashboard_data ---")
    if not ministry_service: app.logger.error("Ministry service not available for /api/dashboard_data"); return jsonify({"error": "Application service not properly initialized."}), 503
    pillar = request.args.get('pillar', 'Transparency').capitalize(); lang = request.args.get('lang', 'en'); period_code = request.args.get('period', 'q2-2023')
    app.logger.info(f"Parameters for dashboard_data: pillar='{pillar}', lang='{lang}', period_code='{period_code}'")
    if lang not in ['en', 'sq', 'sr']: app.logger.warning(f"Invalid lang '{lang}' received for dashboard_data, defaulting to 'en'."); lang = 'en'
    try:
        app.logger.info(f"Calling ministry_service.get_formatted_dashboard_data with pillar={pillar}, lang={lang}, period={period_code}")
        dashboard_data = ministry_service.get_formatted_dashboard_data(pillar=pillar, lang=lang, period_code=period_code)
        app.logger.info(f"ministry_service.get_formatted_dashboard_data returned. Type: {type(dashboard_data)}")
        if isinstance(dashboard_data, dict):
            app.logger.debug(f"Dashboard data keys: {list(dashboard_data.keys())}")
            if 'ministries' in dashboard_data and isinstance(dashboard_data['ministries'], list):
               app.logger.info(f"Number of ministries in dashboard_data: {len(dashboard_data['ministries'])}")
               if len(dashboard_data['ministries']) > 0:
                   app.logger.debug(f"First ministry in dashboard_data (keys): {list(dashboard_data['ministries'][0].keys()) if isinstance(dashboard_data['ministries'][0], dict) else 'Not a dict'}")
            else: app.logger.warning(f"'ministries' key not found or not a list in dashboard_data.")
        elif dashboard_data is None: app.logger.warning("ministry_service.get_formatted_dashboard_data returned None.")
        else: app.logger.info(f"ministry_service.get_formatted_dashboard_data returned non-dict, non-None data: {str(dashboard_data)[:200]}")
        return jsonify(dashboard_data)
    except NotFoundError as e: app.logger.warning(f"NotFoundError in /api/dashboard_data: {str(e)}"); raise
    except Exception as e: app.logger.error(f"Unexpected error in /api/dashboard_data for pillar '{pillar}', period '{period_code}': {e}", exc_info=True); return jsonify({"error": "An unexpected error occurred processing dashboard data."}), 500


@app.route('/api/ministry_details/<int:ministry_id>', methods=['GET'])
def get_ministry_details(ministry_id: int):
    app.logger.info(f"--- Request received for /api/ministry_details/{ministry_id} ---")
    if not ministry_service: app.logger.error(f"Ministry service not available for /api/ministry_details/{ministry_id}"); return jsonify({"error": "Application service not properly initialized."}), 503
    lang = request.args.get('lang', 'en'); period_code = request.args.get('period')
    if lang not in ['en', 'sq', 'sr']: app.logger.warning(f"Invalid lang '{lang}' received for ministry_details/{ministry_id}, defaulting to 'en'."); lang = 'en'
    app.logger.info(f"Parameters for ministry_details: ministry_id={ministry_id}, lang='{lang}', period_code='{period_code}'")
    if not period_code: default_period_for_details = 'q2-2023'; app.logger.warning(f"No 'period' query parameter received... Defaulting to '{default_period_for_details}'."); period_code = default_period_for_details
    try:
        app.logger.info(f"Calling ministry_service.get_formatted_ministry_details for id={ministry_id}, lang={lang}, period={period_code}")
        formatted_details = ministry_service.get_formatted_ministry_details(ministry_id=ministry_id, lang=lang, current_period_code=period_code)
        app.logger.info(f"ministry_service.get_formatted_ministry_details returned. Type: {type(formatted_details)}")
        if not formatted_details or not formatted_details.get("profile"): app.logger.warning(f"Ministry with ID {ministry_id} not found..."); raise NotFoundError(message=f"Ministry with ID {ministry_id} not found or details could not be constructed.")
        return jsonify(formatted_details)
    except NotFoundError as e: app.logger.warning(f"NotFoundError in /api/ministry_details for ID {ministry_id}: {str(e)}"); raise
    except Exception as e: app.logger.error(f"Unexpected error in /api/ministry_details for ID {ministry_id}: {e}", exc_info=True); return jsonify({"error": "An unexpected error occurred processing ministry details."}), 500


if __name__ == '__main__':
    app.run(host=app.config.get("HOST", "127.0.0.1"),
            port=app.config.get("PORT", 5000),
            debug=app.config.get("DEBUG", True))