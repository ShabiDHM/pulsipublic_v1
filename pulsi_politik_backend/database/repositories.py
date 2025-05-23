# pulsi_politik_backend/database/repositories.py

print("<<<<< EXECUTING REPOSITORIES.PY (Version: FINAL_WITH_PMO_AND_EXPLICIT_IDS) >>>>>")

import sqlite3
import random
import datetime
import os
from contextlib import contextmanager
from typing import Generator, Optional, Dict, List, Any

# --- Project Path Configuration ---
PROJECT_ROOT_FOR_REPOSITORIES = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEFAULT_DB_FILE_NAME = "kcm_data.db"
ABSOLUTE_DEFAULT_DB_PATH = os.path.join(PROJECT_ROOT_FOR_REPOSITORIES, DEFAULT_DB_FILE_NAME)
CONFIGURED_DB_PATH = ABSOLUTE_DEFAULT_DB_PATH

try:
    from ..config import Config 
    if hasattr(Config, 'DB_PATH') and Config.DB_PATH:
        if not os.path.isabs(Config.DB_PATH):
            CONFIGURED_DB_PATH = os.path.join(PROJECT_ROOT_FOR_REPOSITORIES, Config.DB_PATH)
        else:
            CONFIGURED_DB_PATH = Config.DB_PATH
except (ImportError, AttributeError, ValueError):
    print("WARNING (repositories.py): Could not import or use '..config.Config.DB_PATH'. Using default.")

print(f"INFO (repositories.py): Effective DB Path to be used by repositories: {CONFIGURED_DB_PATH}")

# --- HELPER FUNCTIONS ---
def get_end_date_from_period_code(period_code: str) -> Optional[str]:
    if not period_code: return None
    try:
        if period_code.startswith("q"):
            parts = period_code.split('-')
            quarter = int(parts[0][1:])
            year = int(parts[1])
            month_day_map = {1: (3, 31), 2: (6, 30), 3: (9, 30), 4: (12, 31)}
            if quarter not in month_day_map: return None
            month, day = month_day_map[quarter]
            return datetime.date(year, month, day).strftime('%Y-%m-%d')
        elif period_code.startswith("annual"):
            year = int(period_code.split('-')[1])
            return datetime.date(year, 12, 31).strftime('%Y-%m-%d')
    except (IndexError, ValueError, TypeError): return None
    return None

def get_previous_period_code(current_period_code: str) -> Optional[str]:
    if not current_period_code: return None
    try:
        if current_period_code.startswith("q"):
            parts = current_period_code.split('-')
            quarter = int(parts[0][1:])
            year = int(parts[1])
            return f"q{quarter-1}-{year}" if quarter > 1 else f"q4-{year-1}"
        elif current_period_code.startswith("annual"):
            year = int(current_period_code.split('-')[1])
            return f"annual-{year-1}"
    except (IndexError, ValueError, TypeError): return None
    return None
# --- END HELPER FUNCTIONS ---

class BaseRepository:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path if db_path is not None else CONFIGURED_DB_PATH
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    @contextmanager
    def _get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        if not os.path.exists(self.db_path) and self.db_path != ':memory:':
            print(f"WARNING (_get_connection): Database file '{self.db_path}' does not exist. SQLite will attempt to create it.")
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        try:
            yield conn
        finally:
            conn.close()


class MinistryRepository(BaseRepository):
    def get_ministry_by_id(self, ministry_id: int) -> Optional[Dict[str, Any]]:
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                query = """SELECT ministry_id, name_en, name_sq, name_sr, abbreviation_en, abbreviation_sq, abbreviation_sr,
                                  minister_name_en, minister_name_sq, minister_name_sr, category_key,
                                  cabinet_member_1_name_en, cabinet_member_1_name_sq, cabinet_member_1_name_sr,
                                  cabinet_member_2_name_en, cabinet_member_2_name_sq, cabinet_member_2_name_sr,
                                  cabinet_member_3_name_en, cabinet_member_3_name_sq, cabinet_member_3_name_sr,
                                  cabinet_member_4_name_en, cabinet_member_4_name_sq, cabinet_member_4_name_sr,
                                  cabinet_member_5_name_en, cabinet_member_5_name_sq, cabinet_member_5_name_sr,
                                  established_date, website_url, contact_email, contact_phone, last_profile_update
                           FROM ministries WHERE ministry_id = ? """
                cursor.execute(query, (ministry_id,))
                row = cursor.fetchone()
                return dict(row) if row else None
        except sqlite3.Error as e:
            print(f"DB Error (get_ministry_by_id for ministry {ministry_id}): {e}")
            return None

    def get_all_ministries_overview(self) -> List[Dict[str, Any]]:
        ministries_list = []
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                # Sort by ID to ensure PMO (ID 0) potentially comes first if desired,
                # or sort by name_en as before if that's preferred.
                query = """ SELECT ministry_id, name_en, name_sq, name_sr, abbreviation_en, abbreviation_sq, abbreviation_sr,
                                   category_key, minister_name_en, minister_name_sq, minister_name_sr
                            FROM ministries ORDER BY ministry_id ASC """ # Changed to ID for PMO first
                cursor.execute(query)
                ministries_list = [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"DB Error (MinistryRepository.get_all_ministries_overview): {e}")
        return ministries_list

    def get_indicators_for_ministry(self, ministry_id: int, assessment_date: Optional[str] = None) -> List[Dict[str, Any]]:
        results_list = []
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                query_parts = [ """SELECT indicator_log_id, ministry_id, pillar_key, indicator_name_en, indicator_name_sq, indicator_name_sr,
                                          value, unit, assessment_date, period_code, description_en, description_sq, description_sr,
                                          data_source_en, data_source_sq, data_source_sr
                                   FROM ministry_indicators WHERE ministry_id = ?""" ]
                params: List[Any] = [ministry_id]
                if assessment_date:
                    query_parts.append("AND assessment_date = ?")
                    params.append(assessment_date)
                query_parts.append("ORDER BY pillar_key, assessment_date DESC")
                query = " ".join(query_parts)
                cursor.execute(query, tuple(params))
                results_list = [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"DB Error (MinistryRepository.get_indicators_for_ministry for ministry {ministry_id}): {e}")
        return results_list

    def get_kpis_for_ministry(self, ministry_id: int, kpi_name_keys_list: Optional[List[str]] = None, period_code_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        results_list = []
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                query_parts = [ """SELECT kpi_id, ministry_id, kpi_name_key, kpi_value_numeric, kpi_value_text, unit, 
                                          period_start_date, period_end_date, last_updated 
                                   FROM ministry_kpis WHERE ministry_id = ?""" ]
                params: List[Any] = [ministry_id]
                if kpi_name_keys_list:
                    placeholders = ','.join('?' for _ in kpi_name_keys_list)
                    query_parts.append(f"AND kpi_name_key IN ({placeholders})")
                    params.extend(kpi_name_keys_list)
                
                if period_code_filter: 
                    actual_period_end_date = get_end_date_from_period_code(period_code_filter)
                    if actual_period_end_date:
                        query_parts.append("AND period_end_date = ?") 
                        params.append(actual_period_end_date)
                    else:
                        print(f"WARNING (get_kpis_for_ministry): Could not convert period_code '{period_code_filter}' to valid date for ministry_id {ministry_id}. Not filtering KPIs by period.")
                
                query_parts.append("ORDER BY period_end_date DESC, kpi_name_key")
                query = " ".join(query_parts)
                cursor.execute(query, tuple(params))
                results_list = [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"DB Error (MinistryRepository.get_kpis_for_ministry for ministry {ministry_id}, period_code {period_code_filter}): {e}")
        return results_list

    def get_recent_activities_for_ministry(self, ministry_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        results_list = []
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                query = f""" SELECT activity_id, ministry_id, activity_date, title_en, title_sq, title_sr,
                                    description_en, description_sq, description_sr, category_en, category_sq, category_sr,
                                    source_url, is_highlight, created_at
                             FROM ministry_activities WHERE ministry_id = ? 
                             ORDER BY activity_date DESC, created_at DESC LIMIT ? """
                cursor.execute(query, (ministry_id, limit))
                results_list = [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"DB Error (MinistryRepository.get_recent_activities_for_ministry for ministry {ministry_id}): {e}")
        return results_list

    def get_dashboard_indicators_by_pillar(self, pillar_key_filter: str, period_code: Optional[str] = None) -> List[Dict[str, Any]]:
        results_list = []
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                final_params_list: List[Any] = []
                
                # Parameters for CTE
                final_params_list.append(pillar_key_filter)
                cte_period_sql_condition = ""
                if period_code:
                    final_params_list.append(period_code)
                    cte_period_sql_condition = "AND period_code = ?"
                
                # Parameters for JOIN condition
                join_mad_period_sql_condition = ""
                if period_code: 
                    final_params_list.append(period_code) # This was the duplicated param, now it's for JOIN
                    join_mad_period_sql_condition = "AND mad.period_code = ?" 

                # Parameters for final WHERE clause
                final_params_list.append(pillar_key_filter) # This is correct for mi.pillar_key
                where_mi_period_sql_condition = ""
                if period_code:
                    final_params_list.append(period_code) # This is correct for mi.period_code
                    where_mi_period_sql_condition = "AND mi.period_code = ?"

                query = f"""
                    WITH MaxAssessmentDates AS (
                        SELECT ministry_id, pillar_key, period_code, MAX(assessment_date) as max_assessment_date
                        FROM ministry_indicators 
                        WHERE pillar_key = ? {cte_period_sql_condition} 
                        GROUP BY ministry_id, pillar_key, period_code
                    )
                    SELECT 
                        m.ministry_id, m.name_en, m.name_sq, m.name_sr, 
                        m.minister_name_en, m.minister_name_sq, m.minister_name_sr,
                        m.cabinet_member_1_name_en, m.cabinet_member_1_name_sq, m.cabinet_member_1_name_sr,
                        m.cabinet_member_2_name_en, m.cabinet_member_2_name_sq, m.cabinet_member_2_name_sr,
                        m.cabinet_member_3_name_en, m.cabinet_member_3_name_sq, m.cabinet_member_3_name_sr,
                        m.cabinet_member_4_name_en, m.cabinet_member_4_name_sq, m.cabinet_member_4_name_sr,
                        m.cabinet_member_5_name_en, m.cabinet_member_5_name_sq, m.cabinet_member_5_name_sr,
                        m.category_key, 
                        mi.value AS score, mi.indicator_log_id, mi.assessment_date, mi.pillar_key,
                        mi.period_code AS indicator_period_code 
                    FROM ministries m
                    JOIN ministry_indicators mi ON m.ministry_id = mi.ministry_id
                    JOIN MaxAssessmentDates mad ON mi.ministry_id = mad.ministry_id 
                                               AND mi.pillar_key = mad.pillar_key
                                               AND mi.assessment_date = mad.max_assessment_date
                                               {join_mad_period_sql_condition}  -- Condition for mad using period_code
                    WHERE mi.pillar_key = ? {where_mi_period_sql_condition} -- Condition for mi using period_code
                    ORDER BY score DESC, m.name_en ASC 
                """ # ORDER BY ministry_id ASC if PMO (ID 0) should be first by default
                final_params_tuple = tuple(final_params_list)
                cursor.execute(query, final_params_tuple)
                results_list = [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"DB Error (get_dashboard_indicators_by_pillar for pillar '{pillar_key_filter}', period '{period_code}'): {e}")
        return results_list

    def get_all_pillar_scores_for_period(self, period_code: str) -> List[Dict[str, Any]]:
        results_list = []
        defined_pillars = ["Transparency", "Participation", "Efficiency"]
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                params: List[Any] = [period_code]
                params.extend(defined_pillars) 
                params.append(period_code)     
                params.extend(defined_pillars)
                query = f"""
                    WITH LatestPillarAssessments AS (
                        SELECT ministry_id, pillar_key, MAX(assessment_date) AS max_assessment_date
                        FROM ministry_indicators
                        WHERE period_code = ? AND pillar_key IN ({','.join('?' for _ in defined_pillars)})
                        GROUP BY ministry_id, pillar_key 
                    )
                    SELECT
                        m.ministry_id, m.name_en, m.name_sq, m.name_sr,
                        m.minister_name_en, m.minister_name_sq, m.minister_name_sr,
                        m.cabinet_member_1_name_en, m.cabinet_member_1_name_sq, m.cabinet_member_1_name_sr,
                        m.cabinet_member_2_name_en, m.cabinet_member_2_name_sq, m.cabinet_member_2_name_sr,
                        m.cabinet_member_3_name_en, m.cabinet_member_3_name_sq, m.cabinet_member_3_name_sr,
                        m.cabinet_member_4_name_en, m.cabinet_member_4_name_sq, m.cabinet_member_4_name_sr,
                        m.cabinet_member_5_name_en, m.cabinet_member_5_name_sq, m.cabinet_member_5_name_sr,
                        m.category_key, mi.pillar_key, mi.value AS score
                    FROM ministries m
                    JOIN ministry_indicators mi ON m.ministry_id = mi.ministry_id
                    JOIN LatestPillarAssessments lpa ON mi.ministry_id = lpa.ministry_id
                                                 AND mi.pillar_key = lpa.pillar_key
                                                 AND mi.assessment_date = lpa.max_assessment_date
                    WHERE mi.period_code = ? AND mi.pillar_key IN ({','.join('?' for _ in defined_pillars)})
                    ORDER BY m.ministry_id, mi.pillar_key;
                """
                cursor.execute(query, tuple(params))
                results_list = [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"DB Error (get_all_pillar_scores_for_period for period '{period_code}'): {e}")
        return results_list

    def get_average_score_for_pillar_period(self, pillar_key: str, period_code: Optional[str]) -> Optional[float]:
        if not period_code: return None
        ministries_for_period = self.get_dashboard_indicators_by_pillar(pillar_key, period_code)
        if not ministries_for_period: return None 
        scores = [m['score'] for m in ministries_for_period if m.get('score') is not None]
        if not scores: return None 
        average = round(sum(scores) / len(scores), 1)
        return average

    def get_kpi_summary_for_dashboard(self, current_period_code: Optional[str]) -> Dict[str, Dict[str, Optional[float]]]:
        summary = { 
            "avgTransparency": {"value": None, "change": None}, 
            "participationScore": {"value": None, "change": None}, 
            "efficiencyRating": {"value": None, "change": None}, 
            "overallOutcome": {"value": None, "change": None} 
        }
        if not current_period_code: return summary
        
        kpi_to_pillar_map = { 
            "avgTransparency": "Transparency", 
            "participationScore": "Participation", 
            "efficiencyRating": "Efficiency" 
        }
        previous_period_code = get_previous_period_code(current_period_code)

        for kpi_key, pillar_key in kpi_to_pillar_map.items():
            current_value = self.get_average_score_for_pillar_period(pillar_key, current_period_code)
            summary[kpi_key]["value"] = current_value
            if previous_period_code:
                previous_value = self.get_average_score_for_pillar_period(pillar_key, previous_period_code)
                if current_value is not None and previous_value is not None:
                    summary[kpi_key]["change"] = round(current_value - previous_value, 1)
        
        current_vals_for_overall = [summary[k]["value"] for k in kpi_to_pillar_map if summary[k]["value"] is not None]
        if current_vals_for_overall:
            summary["overallOutcome"]["value"] = round(sum(current_vals_for_overall) / len(current_vals_for_overall), 1)
        
        if previous_period_code and summary["overallOutcome"]["value"] is not None:
            prev_overall_components = [self.get_average_score_for_pillar_period(p, previous_period_code) for p in kpi_to_pillar_map.values()]
            valid_prev_overall_components = [v for v in prev_overall_components if v is not None]
            if valid_prev_overall_components:
                prev_overall_value = round(sum(valid_prev_overall_components) / len(valid_prev_overall_components), 1)
                if summary["overallOutcome"]["value"] is not None and prev_overall_value is not None:
                    summary["overallOutcome"]["change"] = round(summary["overallOutcome"]["value"] - prev_overall_value, 1)
        return summary

# --- Database Setup Functions ---
def _get_direct_db_connection_for_setup(db_path_for_setup: str):
    db_dir = os.path.dirname(db_path_for_setup)
    if db_dir and not os.path.exists(db_dir): 
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(db_path_for_setup)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path: Optional[str] = None):
    actual_db_path = db_path if db_path is not None else CONFIGURED_DB_PATH
    print(f"Initializing database schema in '{actual_db_path}'...")
    conn = _get_direct_db_connection_for_setup(actual_db_path)
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS ministry_activities")
    cursor.execute("DROP TABLE IF EXISTS ministry_kpis")
    cursor.execute("DROP TABLE IF EXISTS ministry_indicators")
    cursor.execute("DROP TABLE IF EXISTS ministries")
    print("Relevant tables dropped (if they existed).")
    cursor.execute('''
        CREATE TABLE ministries (
            ministry_id INTEGER PRIMARY KEY, 
            name_en TEXT NOT NULL UNIQUE,
            name_sq TEXT NOT NULL UNIQUE,
            name_sr TEXT UNIQUE,
            abbreviation_en TEXT,
            abbreviation_sq TEXT,
            abbreviation_sr TEXT,
            minister_name_en TEXT,
            minister_name_sq TEXT,
            minister_name_sr TEXT,
            category_key TEXT,
            cabinet_member_1_name_en TEXT, cabinet_member_1_name_sq TEXT, cabinet_member_1_name_sr TEXT,
            cabinet_member_2_name_en TEXT, cabinet_member_2_name_sq TEXT, cabinet_member_2_name_sr TEXT,
            cabinet_member_3_name_en TEXT, cabinet_member_3_name_sq TEXT, cabinet_member_3_name_sr TEXT,
            cabinet_member_4_name_en TEXT, cabinet_member_4_name_sq TEXT, cabinet_member_4_name_sr TEXT,
            cabinet_member_5_name_en TEXT, cabinet_member_5_name_sq TEXT, cabinet_member_5_name_sr TEXT,
            established_date TEXT,
            website_url TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            last_profile_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("'ministries' table created.")
    cursor.execute('''
        CREATE TABLE ministry_indicators (
            indicator_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            ministry_id INTEGER NOT NULL,
            pillar_key TEXT NOT NULL,
            indicator_name_en TEXT,
            indicator_name_sq TEXT,
            indicator_name_sr TEXT,
            value REAL NOT NULL,
            unit TEXT DEFAULT 'Score (0-100)',
            assessment_date TEXT NOT NULL,
            period_code TEXT,
            description_en TEXT, description_sq TEXT, description_sr TEXT,
            data_source_en TEXT, data_source_sq TEXT, data_source_sr TEXT,
            FOREIGN KEY (ministry_id) REFERENCES ministries (ministry_id) ON DELETE CASCADE
        )
    ''')
    print("'ministry_indicators' table created.")
    cursor.execute('''
        CREATE TABLE ministry_kpis (
            kpi_id INTEGER PRIMARY KEY AUTOINCREMENT,
            ministry_id INTEGER NOT NULL,
            kpi_name_key TEXT NOT NULL,
            kpi_value_numeric REAL,
            kpi_value_text TEXT,
            unit TEXT,
            period_start_date TEXT NOT NULL,
            period_end_date TEXT NOT NULL,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ministry_id) REFERENCES ministries (ministry_id) ON DELETE CASCADE,
            UNIQUE (ministry_id, kpi_name_key, period_end_date)
        )
    ''')
    print("'ministry_kpis' table created.")
    cursor.execute('''
        CREATE TABLE ministry_activities (
            activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
            ministry_id INTEGER NOT NULL,
            activity_date TEXT NOT NULL,
            title_en TEXT NOT NULL,
            title_sq TEXT NOT NULL,
            title_sr TEXT,
            description_en TEXT,
            description_sq TEXT,
            description_sr TEXT,
            category_en TEXT,
            category_sq TEXT,
            category_sr TEXT,
            source_url TEXT,
            is_highlight INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (ministry_id) REFERENCES ministries (ministry_id) ON DELETE CASCADE
        )
    ''')
    print("'ministry_activities' table created.")
    conn.commit()
    conn.close()
    print(f"Database '{actual_db_path}' initialized with new schema.")


def populate_all_ministry_data(db_path: Optional[str] = None):
    actual_db_path = db_path if db_path is not None else CONFIGURED_DB_PATH
    print(f"Populating data in '{actual_db_path}'...")
    conn = _get_direct_db_connection_for_setup(actual_db_path)
    cursor = conn.cursor()

    pmo_data_entry = {
        "id": 0, 
        "names": {"en": "Office of the Prime Minister", "sq": "Zyra e Kryeministrit", "sr": "Kancelarija Premijera"},
        "abbrs": {"en": "OPM", "sq": "ZKM", "sr": "KP"},
        "minister": {"en": "Prime Minister", "sq": "Kryeministri", "sr": "Premijer"},
        "category_key": "governance", 
        "cabinets": {"en": ["Chief of Staff", "", "", "", ""], "sq": ["Shefi i Kabinetit", "", "", "", ""], "sr": ["Šef Kabineta", "", "", "", ""]}
    }

    ministries_data_source = [
        {"id": 1, "names": {"en": "Ministry of Finance, Labour and Transfers", "sq": "Ministria e Financave, Punës dhe Transfereve", "sr": "Ministarstvo finansija, rada i transfera"}, "abbrs": {"en": "MFLT", "sq": "MFPT", "sr": "MFRT"}, "minister": {"en": "Hekuran Murati", "sq": "Hekuran Murati", "sr": "Hekuran Murati"}, "category_key": "economic", "cabinets": { "en": ["Hekuran Murati", "Agon Dobruna"], "sq": ["Hekuran Murati", "Agon Dobruna"], "sr": ["Hekuran Murati", "Agon Dobruna"] } },
        {"id": 2, "names": {"en": "Ministry of Foreign Affairs and Diaspora", "sq": "Ministria e Punëve të Jashtme dhe Diasporës", "sr": "Ministarstvo spoljnih poslova i dijaspore"}, "abbrs": {"en": "MFA", "sq": "MPJD", "sr": "MSP"}, "minister": {"en": "Donika Gërvalla-Schwarz", "sq": "Donika Gërvalla-Schwarz", "sr": "Donika Gervala-Švarc"}, "category_key": "governance", "cabinets": { "en": ["Donika Gërvalla-Schwarz", "Kreshnik Ahmeti", "Liza Gashi"], "sq": ["Donika Gërvalla-Schwarz", "Kreshnik Ahmeti", "Liza Gashi"], "sr": ["Donika Gervala-Švarc", "Krešnik Ahmeti", "Liza Gaši"] } },
        {"id": 3, "names": {"en": "Ministry of Justice", "sq": "Ministria e Drejtësisë", "sr": "Ministarstvo pravde"}, "abbrs": {"en": "MoJ", "sq": "MD", "sr": "MP"}, "minister": {"en": "Albulena Haxhiu", "sq": "Albulena Haxhiu", "sr": "Aljbulena Hadžiju"}, "category_key": "governance", "cabinets": { "en": ["Albulena Haxhiu", "Blerim Sallahu", "Vigan Qorrolli"], "sq": ["Albulena Haxhiu", "Blerim Sallahu", "Vigan Qorrolli"], "sr": ["Aljbulena Hadžiju", "Blerim Salahu", "Vigan Ćoroli"] } },
        {"id": 4, "names": {"en": "Ministry of Defence", "sq": "Ministria e Mbrojtjes", "sr": "Ministarstvo odbrane"}, "abbrs": {"en": "MoD", "sq": "MM", "sr": "MO"}, "minister": {"en": "Ejup Maqedonci", "sq": "Ejup Maqedonci", "sr": "Ejup Maćedonci"}, "category_key": "governance", "cabinets": { "en": ["Ejup Maqedonci", "Shemsi Syla"], "sq": ["Ejup Maqedonci", "Shemsi Syla"], "sr": ["Ejup Maćedonci", "Šemsi Sila"] } },
        {"id": 5, "names": {"en": "Ministry of Internal Affairs", "sq": "Ministria e Punëve të Brendshme", "sr": "Ministarstvo unutrašnjih poslova"}, "abbrs": {"en": "MIA", "sq": "MPB", "sr": "MUP"}, "minister": {"en": "Xhelal Sveçla", "sq": "Xhelal Sveçla", "sr": "Dželjalj Svečlja"}, "category_key": "governance", "cabinets": { "en": ["Xhelal Sveçla", "Bardhyl Dobra", "Blerim Gashani"], "sq": ["Xhelal Sveçla", "Bardhyl Dobra", "Blerim Gashani"], "sr": ["Dželjalj Svečlja", "Bardilj Dobra", "Blerim Gašani"] } },
        {"id": 6, "names": {"en": "Ministry of Health", "sq": "Ministria e Shëndetësisë", "sr": "Ministarstvo zdravlja"}, "abbrs": {"en": "MoH", "sq": "MSH", "sr": "MZ"}, "minister": {"en": "Arben Vitia", "sq": "Arben Vitia", "sr": "Arben Vitia"}, "category_key": "social", "cabinets": { "en": ["Arben Vitia", "Dafina Gexha-Bunjaku", "Arsim Berisha"], "sq": ["Arben Vitia", "Dafina Gexha-Bunjaku", "Arsim Berisha"], "sr": ["Arben Vitia", "Dafina Gedža-Bunjaku", "Arsim Beriša"] } },
        {"id": 7, "names": {"en": "Ministry of Education, Science, Technology and Innovation", "sq": "Ministria e Arsimit, Shkencës, Teknologjisë dhe Inovacionit", "sr": "Ministarstvo obrazovanja, nauke, tehnologije i inovacija"}, "abbrs": {"en": "MESTI", "sq": "MASHTI", "sr": "MONTI"}, "minister": {"en": "Arbërie Nagavci", "sq": "Arbërie Nagavci", "sr": "Arberie Nagavci"}, "category_key": "social", "cabinets": { "en": ["Arbërie Nagavci", "Dukagjin Pupovci", "Edona Maloku-Bërdyna"], "sq": ["Arbërie Nagavci", "Dukagjin Pupovci", "Edona Maloku-Bërdyna"], "sr": ["Arberie Nagavci", "Dukađin Pupovci", "Edona Maloku-Berdina"] } },
        {"id": 8, "names": {"en": "Ministry of Culture, Youth and Sports", "sq": "Ministria e Kulturës, Rinisë dhe Sportit", "sr": "Ministarstvo kulture, omladine i sporta"}, "abbrs": {"en": "MCYS", "sq": "MKRS", "sr": "MKOS"}, "minister": {"en": "Hajrulla Çeku", "sq": "Hajrulla Çeku", "sr": "Hajrula Čeku"}, "category_key": "social", "cabinets": { "en": ["Hajrulla Çeku", "Daulina Osmani", "Sylejman Elshani"], "sq": ["Hajrulla Çeku", "Daulina Osmani", "Sylejman Elshani"], "sr": ["Hajrula Čeku", "Daulina Osmani", "Sulejman Elšani"] } },
        {"id": 9, "names": {"en": "Ministry of Local Government Administration", "sq": "Ministria e Administrimit të Pushtetit Lokal", "sr": "Ministarstvo administracije lokalne samouprave"}, "abbrs": {"en": "MLGA", "sq": "MAPL", "sr": "MALS"}, "minister": {"en": "Elbert Krasniqi", "sq": "Elbert Krasniqi", "sr": "Eljbert Krasnići"}, "category_key": "governance", "cabinets": { "en": ["Elbert Krasniqi", "Arbër Vokrri"], "sq": ["Elbert Krasniqi", "Arbër Vokrri"], "sr": ["Eljbert Krasnići", "Arber Vokri"] } },
        {"id": 10, "names": {"en": "Ministry of Environment, Spatial Planning and Infrastructure", "sq": "Ministria e Mjedisit, Planifikimit Hapësinor dhe Infrastrukturës", "sr": "Ministarstvo životne sredine, prostornog planiranja i infrastrukture"}, "abbrs": {"en": "MESPI", "sq": "MMPHI", "sr": "MZSPI"}, "minister": {"en": "Liburn Aliu", "sq": "Liburn Aliu", "sr": "Ljiburn Aljiu"}, "category_key": "infrastructure", "cabinets": { "en": ["Liburn Aliu", "Hysen Durmishi", "Avni Zogiani"], "sq": ["Liburn Aliu", "Hysen Durmishi", "Avni Zogiani"], "sr": ["Ljiburn Aljiu", "Hisen Durmiši", "Avni Zogjani"] } },
        {"id": 11, "names": {"en": "Ministry of Agriculture, Forestry and Rural Development", "sq": "Ministria e Bujqësisë, Pylltarisë dhe Zhvillimit Rural", "sr": "Ministarstvo poljoprivrede, šumarstva i ruralnog razvoja"}, "abbrs": {"en": "MAFRD", "sq": "MBPZHR", "sr": "MPSRR"}, "minister": {"en": "Faton Peci", "sq": "Faton Peci", "sr": "Faton Peci"}, "category_key": "economic", "cabinets": { "en": ["Faton Peci", "Adonika K Hoxha", "Gazmend Gjushinca"], "sq": ["Faton Peci", "Adonika K Hoxha", "Gazmend Gjushinca"], "sr": ["Faton Peci", "Adonika K Hodža", "Gazmend Đušinca"] } },
        {"id": 12, "names": {"en": "Ministry of Industry, Entrepreneurship and Trade", "sq": "Ministria e Industrisë, Ndërmarrësisë dhe Tregtisë", "sr": "Ministarstvo industrije, preduzetništva i trgovine"}, "abbrs": {"en": "MIET", "sq": "MINT", "sr": "MIPT"}, "minister": {"en": "Rozeta Hajdari", "sq": "Rozeta Hajdari", "sr": "Rozeta Hajdari"}, "category_key": "economic", "cabinets": { "en": ["Rozeta Hajdari", "Mentor Arifaj"], "sq": ["Rozeta Hajdari", "Mentor Arifaj"], "sr": ["Rozeta Hajdari", "Mentor Arifaj"] } },
        {"id": 13, "names": {"en": "Ministry of Economy", "sq": "Ministria e Ekonomisë", "sr": "Ministarstvo ekonomije"}, "abbrs": {"en": "ME", "sq": "ME", "sr": "MEk"}, "minister": {"en": "Artane Rizvanolli", "sq": "Artane Rizvanolli", "sr": "Artane Rizvanoli"}, "category_key": "economic", "cabinets": { "en": ["Artane Rizvanolli", "Mentor Geci", "Getoar Mjeku"], "sq": ["Artane Rizvanolli", "Mentor Geci", "Getoar Mjeku"], "sr": ["Artane Rizvanoli", "Mentor Geci", "Getoar Mjeku"] } },
        {"id": 14, "names": {"en": "Ministry for Communities and Returns", "sq": "Ministria për Komunitete dhe Kthim", "sr": "Ministarstvo za zajednice i povratak"}, "abbrs": {"en": "MCR", "sq": "MKK", "sr": "MZP"}, "minister": {"en": "Nenad Rašić", "sq": "Nenad Rašić", "sr": "Nenad Rašić"}, "category_key": "social", "cabinets": { "en": ["Nenad Rašić", "Radoica Radomirović", "Gazmen Salijević"], "sq": ["Nenad Rašić", "Radoica Radomirović", "Gazmen Salijević"], "sr": ["Nenad Rašić", "Radoica Radomirović", "Gazmen Salijević"] } },
        {"id": 15, "names": {"en": "Ministry of Regional Development", "sq": "Ministria e Zhvillimit Rajonal", "sr": "Ministarstvo regionalnog razvoja"}, "abbrs": {"en": "MRD", "sq": "MZHR", "sr": "MRR"}, "minister": {"en": "Fikrim Damka", "sq": "Fikrim Damka", "sr": "Fikrim Damka"}, "category_key": "infrastructure", "cabinets": { "en": ["Fikrim Damka", "Ali Tafarshiku", "Agonislami Ferati"], "sq": ["Fikrim Damka", "Ali Tafarshiku", "Agonislami Ferati"], "sr": ["Fikrim Damka", "Ali Tafaršiku", "Agonislami Ferati"] } }
    ]
    
    all_institutions_to_populate = [pmo_data_entry] + ministries_data_source
    ministry_ids_map = {}

    print(f"\nPopulating 'ministries' table with {len(all_institutions_to_populate)} entries (including PMO)...")
    for item in all_institutions_to_populate:
        current_item_id = item["id"] # Assumes all items now have an "id" field

        padded_cabinets = {}
        for lang_code in ['en', 'sq', 'sr']:
            lang_cabinets_list = item.get("cabinets", {}).get(lang_code, [])
            padded_cabinets[lang_code] = (lang_cabinets_list + ["", "", "", "", ""])[:5]
        
        try:
            cursor.execute("SELECT ministry_id FROM ministries WHERE ministry_id = ?", (current_item_id,))
            existing_entry = cursor.fetchone()

            if not existing_entry:
                cursor.execute(f""" INSERT INTO ministries (
                                        ministry_id, name_en, name_sq, name_sr, 
                                        abbreviation_en, abbreviation_sq, abbreviation_sr, 
                                        minister_name_en, minister_name_sq, minister_name_sr, category_key,
                                        cabinet_member_1_name_en, cabinet_member_1_name_sq, cabinet_member_1_name_sr,
                                        cabinet_member_2_name_en, cabinet_member_2_name_sq, cabinet_member_2_name_sr,
                                        cabinet_member_3_name_en, cabinet_member_3_name_sq, cabinet_member_3_name_sr,
                                        cabinet_member_4_name_en, cabinet_member_4_name_sq, cabinet_member_4_name_sr,
                                        cabinet_member_5_name_en, cabinet_member_5_name_sq, cabinet_member_5_name_sr
                                     )
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) """,
                               ( current_item_id, 
                                 item["names"]["en"], item["names"]["sq"], item["names"].get("sr"), 
                                 item["abbrs"].get("en"), item["abbrs"].get("sq"), item["abbrs"].get("sr"), 
                                 item["minister"]["en"], item["minister"]["sq"], item["minister"].get("sr"), 
                                 item["category_key"],
                                 padded_cabinets['en'][0], padded_cabinets['sq'][0], padded_cabinets['sr'][0],
                                 padded_cabinets['en'][1], padded_cabinets['sq'][1], padded_cabinets['sr'][1],
                                 padded_cabinets['en'][2], padded_cabinets['sq'][2], padded_cabinets['sr'][2],
                                 padded_cabinets['en'][3], padded_cabinets['sq'][3], padded_cabinets['sr'][3],
                                 padded_cabinets['en'][4], padded_cabinets['sq'][4], padded_cabinets['sr'][4] ))
                ministry_ids_map[item["names"]["en"]] = current_item_id
            else:
                ministry_ids_map[item["names"]["en"]] = existing_entry['ministry_id']
        except sqlite3.IntegrityError as e:
            print(f"  IntegrityError for {item['names']['en']} (ID {current_item_id}): {e}. This might happen if name_en is not unique across different IDs if re-running on existing DB.")
            cursor.execute("SELECT ministry_id FROM ministries WHERE name_en = ?", (item["names"]["en"],))
            row = cursor.fetchone()
            if row: ministry_ids_map[item["names"]["en"]] = row['ministry_id']
        except sqlite3.Error as e:
            print(f"  DB Error for {item['names']['en']} (ID {current_item_id}): {e}")

    print(f"Ministries populated/mapped: {len(ministry_ids_map)}.")

    pillars_for_indicators = ["Transparency", "Participation", "Efficiency"] 
    periods_for_data = { 
        "q1-2023": (datetime.date(2023, 1, 1), datetime.date(2023, 3, 31)), 
        "q2-2023": (datetime.date(2023, 4, 1), datetime.date(2023, 6, 30)), 
        "q3-2023": (datetime.date(2023, 7, 1), datetime.date(2023, 9, 30)), 
        "q4-2022": (datetime.date(2022, 10, 1), datetime.date(2022, 12, 31)) 
    }
    print(f"\nPopulating 'ministry_indicators' for {len(periods_for_data)} periods and {len(pillars_for_indicators)} pillars...")
    indicators_inserted_count = 0
    for period_code, (start_date, end_date) in periods_for_data.items():
        assessment_date_for_period = end_date.strftime('%Y-%m-%d')
        for ministry_english_name, ministry_id_val in ministry_ids_map.items():
            for pillar_key in pillars_for_indicators:
                if ministry_id_val == pmo_data_entry["id"]: 
                    value = round(random.uniform(78.0, 95.0), 1) 
                else:
                    value = round(random.uniform(45.0, 90.0), 1) 
                
                cursor.execute("""SELECT indicator_log_id FROM ministry_indicators 
                                  WHERE ministry_id = ? AND pillar_key = ? AND period_code = ? AND assessment_date = ?""",
                               (ministry_id_val, pillar_key, period_code, assessment_date_for_period))
                if cursor.fetchone() is None:
                    cursor.execute(""" INSERT INTO ministry_indicators (
                                            ministry_id, pillar_key, indicator_name_en, indicator_name_sq, indicator_name_sr, 
                                            value, unit, assessment_date, period_code, 
                                            description_en, description_sq, description_sr, 
                                            data_source_en, data_source_sq, data_source_sr
                                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) """, 
                                   (ministry_id_val, pillar_key, 
                                    f"{pillar_key} Index", f"Indeksi i {pillar_key}", f"{pillar_key} Indeks", 
                                    value, 'Score (0-100)', assessment_date_for_period, period_code, 
                                    f"Overall {pillar_key.lower()} performance index.", 
                                    f"Indeksi i përgjithshëm i performancës {pillar_key.lower()}.", 
                                    f"Sveukupni indeks učinka {pillar_key.lower()}.", 
                                    "Simulated Data Source", "Burim i Simuluar", "Simulirani Izvor"))
                    indicators_inserted_count += 1
    print(f"New ministry indicators (pillar scores) inserted: {indicators_inserted_count}.")

    kpi_definitions_for_details_page = [ 
        'website_transparency_score', 'info_requests_received_count', 'info_requests_processed_count', 
        'avg_response_time_days', 'document_accessibility_score', 'request_responsiveness_score', 
        'information_completeness_score', 'public_engagement_score', 'budget_utilization_percentage' 
    ]
    print(f"\nPopulating 'ministry_kpis' for {len(periods_for_data)} periods and {len(kpi_definitions_for_details_page)} KPI types...")
    kpis_inserted_count = 0
    for period_code_str, (period_s_obj, period_e_obj) in periods_for_data.items():
        period_start_str = period_s_obj.strftime('%Y-%m-%d')
        period_end_str = period_e_obj.strftime('%Y-%m-%d')
        for ministry_english_name, ministry_id_val in ministry_ids_map.items():
            for kpi_name_key in kpi_definitions_for_details_page:
                kpi_val_num = None; kpi_unit = '%'; 
                if 'count' in kpi_name_key: 
                    kpi_val_num = random.randint(20, 80) if ministry_id_val == pmo_data_entry["id"] else random.randint(10, 200)
                    kpi_unit = 'count'
                elif 'days' in kpi_name_key: 
                    kpi_val_num = round(random.uniform(1.0, 7.0), 1) if ministry_id_val == pmo_data_entry["id"] else round(random.uniform(1.0, 25.0), 1)
                    kpi_unit = 'days'
                elif 'score' in kpi_name_key or 'percentage' in kpi_name_key: 
                    kpi_val_num = random.randint(70, 98) if ministry_id_val == pmo_data_entry["id"] else random.randint(30, 95)
                else: kpi_val_num = random.randint(0,100)
                
                try: 
                    cursor.execute("""INSERT INTO ministry_kpis 
                                      (ministry_id, kpi_name_key, kpi_value_numeric, unit, period_start_date, period_end_date) 
                                      VALUES (?,?,?,?,?,?)""", 
                                   (ministry_id_val, kpi_name_key, kpi_val_num, kpi_unit, period_start_str, period_end_str))
                    kpis_inserted_count+=1
                except sqlite3.IntegrityError: pass 
                except sqlite3.Error as e: print(f"  DB Error inserting KPI '{kpi_name_key}' for ministry {ministry_id_val}: {e}")
    print(f"Ministry KPIs (detailed metrics) inserted/attempted: {kpis_inserted_count}.")

    print(f"\nPopulating 'ministry_activities'...")
    activities_inserted_count = 0
    for ministry_english_name, ministry_id_val in ministry_ids_map.items():
        for i in range(random.randint(1,3)): 
            activity_date_dt = datetime.date.today() - datetime.timedelta(days=random.randint(1, 180))
            activity_date_str = activity_date_dt.strftime('%Y-%m-%d')
            
            if ministry_id_val == pmo_data_entry["id"]:
                 cat_en = random.choice(["National Directive","Cabinet Meeting Summary","Press Conference"])
                 title_en = f"{cat_en}: PMO Action - Ref {random.randint(100,999)}"
                 title_sq = title_en.replace("PMO Action", "Veprim ZKM").replace("National Directive", "Direktivë Kombëtare").replace("Cabinet Meeting Summary", "Përmbledhje e Mbledhjes së Kabinetit").replace("Press Conference", "Konferencë për Media")
                 title_sr = title_en.replace("PMO Action", "Akcija KP").replace("National Directive", "Nacionalna Direktiva").replace("Cabinet Meeting Summary", "Rezime Sastanka Kabineta").replace("Press Conference", "Konferencija za Štampu")
            else:
                 cat_en = random.choice(["Policy Update","Public Event","Report Release", "New Initiative", "Consultation Document"])
                 title_en = f"{cat_en}: {ministry_english_name} Initiative - Ref {random.randint(100,999)}"
                 title_sq = title_en.replace("Initiative", "Nismë").replace(ministry_english_name, "Ministria") 
                 title_sr = title_en.replace("Initiative", "Inicijativa").replace(ministry_english_name, "Ministarstvo") 

            desc_en = f"Details regarding {title_en}."
            desc_sq = f"Detaje lidhur me {title_sq}."
            desc_sr = f"Detalji u vezi sa {title_sr}."

            cursor.execute("""INSERT INTO ministry_activities 
                              (ministry_id, activity_date, title_en, title_sq, title_sr, 
                               description_en, description_sq, description_sr, 
                               category_en, category_sq, category_sr, source_url) 
                              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""", 
                           (ministry_id_val, activity_date_str, title_en, title_sq, title_sr, 
                            desc_en, desc_sq, desc_sr,
                            cat_en, cat_en, cat_en, 
                            f"http://example.gov/activity/{ministry_id_val}/{random.randint(1000,9999)}"))
            activities_inserted_count+=1
    print(f"Ministry activities inserted: {activities_inserted_count}.")
    
    conn.commit()
    conn.close()
    print(f"\n--- Data Population Complete for '{actual_db_path}' ---")

# --- Main execution for direct script run (testing/setup) ---
if __name__ == '__main__':
    print(f"Running database script directly using effective DB path: '{CONFIGURED_DB_PATH}'...")
    init_db() 
    populate_all_ministry_data() 
    
    print("\n--- Example Repository Method Tests (using CONFIGURED_DB_PATH) ---")
    repo = MinistryRepository() 
    test_period = "q2-2023" 
    
    print(f"\nALL MINISTRIES OVERVIEW (first 5 of {len(repo.get_all_ministries_overview())}):")
    overview = repo.get_all_ministries_overview()
    for m in overview[:5]: print(dict(m))
    if not overview: print("WARNING: No ministries found in overview.")
    
    print(f"\nDashboard KPI Summary for {test_period}:")
    kpi_summary_test = repo.get_kpi_summary_for_dashboard(test_period)
    print(kpi_summary_test)
    if not any(v.get('value') is not None for v in kpi_summary_test.values() if isinstance(v, dict)):
        print(f"WARNING: KPI Summary for {test_period} seems to have all null values.")
    
    print(f"\nDashboard Indicators for Transparency, {test_period} (first 5 of {len(repo.get_dashboard_indicators_by_pillar('Transparency', test_period))} if any):")
    dash_indicators = repo.get_dashboard_indicators_by_pillar("Transparency", test_period)
    for i, indicator in enumerate(dash_indicators[:5]): print(f"  Row {i+1}: {dict(indicator)}")
    if not dash_indicators: print(f"WARNING: No dashboard indicators found for Transparency, {test_period}.")
    
    print(f"\nALL PILLAR SCORES for {test_period} (first 10 of {len(repo.get_all_pillar_scores_for_period(test_period))} rows):")
    all_scores = repo.get_all_pillar_scores_for_period(test_period)
    for i, score_row in enumerate(all_scores[:10]): print(f"  Row {i+1}: {dict(score_row)}")
    if not all_scores: print(f"WARNING: No scores returned by get_all_pillar_scores_for_period for {test_period}.")
        
    test_ministry_id_pmo = 0
    print(f"\nMinistry Details for PMO (ID {test_ministry_id_pmo}):")
    pmo_details_test = repo.get_ministry_by_id(test_ministry_id_pmo)
    if pmo_details_test: print(dict(pmo_details_test))
    else: print(f"WARNING: No details found for PMO (ID {test_ministry_id_pmo}). Check population.")

    test_ministry_id_regular = 1 
    print(f"\nKPIs for Ministry ID {test_ministry_id_regular}, {test_period} (first 3):")
    kpis_for_ministry_test = repo.get_kpis_for_ministry(test_ministry_id_regular, period_code_filter=test_period)
    if kpis_for_ministry_test: print([dict(k) for k in kpis_for_ministry_test[:3]]) 
    else: print(f"WARNING: No KPIs found for Ministry {test_ministry_id_regular}, {test_period}.")
    
    print(f"\n--- Database script for '{CONFIGURED_DB_PATH}' finished execution. ---")