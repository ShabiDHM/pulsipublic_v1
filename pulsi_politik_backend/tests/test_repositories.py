# pulsi_politik_backend/tests/test_repositories.py
import pytest
import sqlite3 
import os
import datetime 
import random   

# Import from the application's modules
from pulsi_politik_backend.database.repositories import (
    MinistryRepository, 
    init_db as project_init_db, 
    populate_all_ministry_data as project_populate_all_ministry_data
    # ministries_data_source is no longer imported here
)

# --- Define Test Data ---
# This is the same data structure used for populating the database.
# Having it here allows tests to make specific assertions against known data.
# Ensure this list is identical to the 'ministries_data_source' list
# within the populate_all_ministry_data function in your main repositories.py.
# [AI PROMPT]: Explain why `MINISTRIES_TEST_DATA` is defined directly in this test file. How does it help in writing assertions for tests like `test_get_all_ministries_overview_returns_list` and `test_get_ministry_by_id_exists`? What are the pros and cons of this approach versus importing it from the main codebase (if it were made importable)?
MINISTRIES_TEST_DATA = [
    {
        "names": {"en": "Ministry of Finance, Labour and Transfers", "sq": "Ministria e Financave, Punës dhe Transfereve", "sr": "Ministarstvo finansija, rada i transfera"},
        "abbrs": {"en": "MFLT", "sq": "MFPT", "sr": "MFRT"},
        "minister": {"en": "Hekuran Murati", "sq": "Hekuran Murati", "sr": "Hekuran Murati"},
        "category_key": "economic",
        "cabinets": { "en": ["Hekuran Murati", "Agon Dobruna", "", "", ""], "sq": ["Hekuran Murati", "Agon Dobruna", "", "", ""], "sr": ["Hekuran Murati", "Agon Dobruna", "", "", ""] }
    },
    {
        "names": {"en": "Ministry of Foreign Affairs and Diaspora", "sq": "Ministria e Punëve të Jashtme dhe Diasporës", "sr": "Ministarstvo spoljnih poslova i dijaspore"},
        "abbrs": {"en": "MFA", "sq": "MPJD", "sr": "MSP"},
        "minister": {"en": "Donika Gërvalla-Schwarz", "sq": "Donika Gërvalla-Schwarz", "sr": "Donika Gervala-Švarc"},
        "category_key": "governance",
        "cabinets": { "en": ["Donika Gërvalla-Schwarz", "Kreshnik Ahmeti", "Liza Gashi", "", ""], "sq": ["Donika Gërvalla-Schwarz", "Kreshnik Ahmeti", "Liza Gashi", "", ""], "sr": ["Donika Gervala-Švarc", "Krešnik Ahmeti", "Liza Gaši", "", ""] }
    },
    {
        "names": {"en": "Ministry of Justice", "sq": "Ministria e Drejtësisë", "sr": "Ministarstvo pravde"},
        "abbrs": {"en": "MoJ", "sq": "MD", "sr": "MP"},
        "minister": {"en": "Albulena Haxhiu", "sq": "Albulena Haxhiu", "sr": "Aljbulena Hadžiju"},
        "category_key": "governance",
        "cabinets": { "en": ["Albulena Haxhiu", "Blerim Sallahu", "Vigan Qorrolli", "", ""], "sq": ["Albulena Haxhiu", "Blerim Sallahu", "Vigan Qorrolli", "", ""], "sr": ["Aljbulena Hadžiju", "Blerim Salahu", "Vigan Ćoroli", "", ""] }
    },
    {
        "names": {"en": "Ministry of Defence", "sq": "Ministria e Mbrojtjes", "sr": "Ministarstvo odbrane"},
        "abbrs": {"en": "MoD", "sq": "MM", "sr": "MO"},
        "minister": {"en": "Ejup Maqedonci", "sq": "Ejup Maqedonci", "sr": "Ejup Maćedonci"},
        "category_key": "governance",
        "cabinets": { "en": ["Ejup Maqedonci", "Shemsi Syla", "", "", ""], "sq": ["Ejup Maqedonci", "Shemsi Syla", "", "", ""], "sr": ["Ejup Maćedonci", "Šemsi Sila", "", "", ""] }
    },
    {
        "names": {"en": "Ministry of Internal Affairs", "sq": "Ministria e Punëve të Brendshme", "sr": "Ministarstvo unutrašnjih poslova"},
        "abbrs": {"en": "MIA", "sq": "MPB", "sr": "MUP"},
        "minister": {"en": "Xhelal Sveçla", "sq": "Xhelal Sveçla", "sr": "Dželjalj Svečlja"},
        "category_key": "governance",
        "cabinets": { "en": ["Xhelal Sveçla", "Bardhyl Dobra", "Blerim Gashani", "", ""], "sq": ["Xhelal Sveçla", "Bardhyl Dobra", "Blerim Gashani", "", ""], "sr": ["Dželjalj Svečlja", "Bardilj Dobra", "Blerim Gašani", "", ""] }
    },
    {
        "names": {"en": "Ministry of Health", "sq": "Ministria e Shëndetësisë", "sr": "Ministarstvo zdravlja"},
        "abbrs": {"en": "MoH", "sq": "MSH", "sr": "MZ"},
        "minister": {"en": "Arben Vitia", "sq": "Arben Vitia", "sr": "Arben Vitia"},
        "category_key": "social",
        "cabinets": { "en": ["Arben Vitia", "Dafina Gexha-Bunjaku", "Arsim Berisha", "", ""], "sq": ["Arben Vitia", "Dafina Gexha-Bunjaku", "Arsim Berisha", "", ""], "sr": ["Arben Vitia", "Dafina Gedža-Bunjaku", "Arsim Beriša", "", ""] }
    },
    {
        "names": {"en": "Ministry of Education, Science, Technology and Innovation", "sq": "Ministria e Arsimit, Shkencës, Teknologjisë dhe Inovacionit", "sr": "Ministarstvo obrazovanja, nauke, tehnologije i inovacija"},
        "abbrs": {"en": "MESTI", "sq": "MASHTI", "sr": "MONTI"},
        "minister": {"en": "Arbërie Nagavci", "sq": "Arbërie Nagavci", "sr": "Arberie Nagavci"},
        "category_key": "social",
        "cabinets": { "en": ["Arbërie Nagavci", "Dukagjin Pupovci", "Edona Maloku-Bërdyna", "", ""], "sq": ["Arbërie Nagavci", "Dukagjin Pupovci", "Edona Maloku-Bërdyna", "", ""], "sr": ["Arberie Nagavci", "Dukađin Pupovci", "Edona Maloku-Berdina", "", ""] }
    },
    {
        "names": {"en": "Ministry of Culture, Youth and Sports", "sq": "Ministria e Kulturës, Rinisë dhe Sportit", "sr": "Ministarstvo kulture, omladine i sporta"},
        "abbrs": {"en": "MCYS", "sq": "MKRS", "sr": "MKOS"},
        "minister": {"en": "Hajrulla Çeku", "sq": "Hajrulla Çeku", "sr": "Hajrula Čeku"},
        "category_key": "social",
        "cabinets": { "en": ["Hajrulla Çeku", "Daulina Osmani", "Sylejman Elshani", "", ""], "sq": ["Hajrulla Çeku", "Daulina Osmani", "Sylejman Elshani", "", ""], "sr": ["Hajrula Čeku", "Daulina Osmani", "Sulejman Elšani", "", ""] }
    },
    {
        "names": {"en": "Ministry of Local Government Administration", "sq": "Ministria e Administrimit të Pushtetit Lokal", "sr": "Ministarstvo administracije lokalne samouprave"},
        "abbrs": {"en": "MLGA", "sq": "MAPL", "sr": "MALS"},
        "minister": {"en": "Elbert Krasniqi", "sq": "Elbert Krasniqi", "sr": "Eljbert Krasnići"},
        "category_key": "governance",
        "cabinets": { "en": ["Elbert Krasniqi", "Arbër Vokrri", "", "", ""], "sq": ["Elbert Krasniqi", "Arbër Vokrri", "", "", ""], "sr": ["Eljbert Krasnići", "Arber Vokri", "", "", ""] }
    },
    {
        "names": {"en": "Ministry of Environment, Spatial Planning and Infrastructure", "sq": "Ministria e Mjedisit, Planifikimit Hapësinor dhe Infrastrukturës", "sr": "Ministarstvo životne sredine, prostornog planiranja i infrastrukture"},
        "abbrs": {"en": "MESPI", "sq": "MMPHI", "sr": "MZSPI"},
        "minister": {"en": "Liburn Aliu", "sq": "Liburn Aliu", "sr": "Ljiburn Aljiu"},
        "category_key": "infrastructure",
        "cabinets": { "en": ["Liburn Aliu", "Hysen Durmishi", "Avni Zogiani", "", ""], "sq": ["Liburn Aliu", "Hysen Durmishi", "Avni Zogiani", "", ""], "sr": ["Ljiburn Aljiu", "Hisen Durmiši", "Avni Zogjani", "", ""] }
    },
    {
        "names": {"en": "Ministry of Agriculture, Forestry and Rural Development", "sq": "Ministria e Bujqësisë, Pylltarisë dhe Zhvillimit Rural", "sr": "Ministarstvo poljoprivrede, šumarstva i ruralnog razvoja"},
        "abbrs": {"en": "MAFRD", "sq": "MBPZHR", "sr": "MPSRR"},
        "minister": {"en": "Faton Peci", "sq": "Faton Peci", "sr": "Faton Peci"},
        "category_key": "economic",
        "cabinets": { "en": ["Faton Peci", "Adonika K Hoxha", "Gazmend Gjushinca", "", ""], "sq": ["Faton Peci", "Adonika K Hoxha", "Gazmend Gjushinca", "", ""], "sr": ["Faton Peci", "Adonika K Hodža", "Gazmend Đušinca", "", ""] }
    },
    {
        "names": {"en": "Ministry of Industry, Entrepreneurship and Trade", "sq": "Ministria e Industrisë, Ndërmarrësisë dhe Tregtisë", "sr": "Ministarstvo industrije, preduzetništva i trgovine"},
        "abbrs": {"en": "MIET", "sq": "MINT", "sr": "MIPT"},
        "minister": {"en": "Rozeta Hajdari", "sq": "Rozeta Hajdari", "sr": "Rozeta Hajdari"},
        "category_key": "economic",
        "cabinets": { "en": ["Rozeta Hajdari", "Mentor Arifaj", "", "", ""], "sq": ["Rozeta Hajdari", "Mentor Arifaj", "", "", ""], "sr": ["Rozeta Hajdari", "Mentor Arifaj", "", "", ""] }
    },
    {
        "names": {"en": "Ministry of Economy", "sq": "Ministria e Ekonomisë", "sr": "Ministarstvo ekonomije"},
        "abbrs": {"en": "ME", "sq": "ME", "sr": "MEk"},
        "minister": {"en": "Artane Rizvanolli", "sq": "Artane Rizvanolli", "sr": "Artane Rizvanoli"},
        "category_key": "economic",
        "cabinets": { "en": ["Artane Rizvanolli", "Mentor Geci", "Getoar Mjeku", "", ""], "sq": ["Artane Rizvanolli", "Mentor Geci", "Getoar Mjeku", "", ""], "sr": ["Artane Rizvanoli", "Mentor Geci", "Getoar Mjeku", "", ""] }
    },
    {
        "names": {"en": "Ministry for Communities and Returns", "sq": "Ministria për Komunitete dhe Kthim", "sr": "Ministarstvo za zajednice i povratak"},
        "abbrs": {"en": "MCR", "sq": "MKK", "sr": "MZP"},
        "minister": {"en": "Nenad Rašić", "sq": "Nenad Rašić", "sr": "Nenad Rašić"},
        "category_key": "social",
        "cabinets": { "en": ["Nenad Rašić", "Radoica Radomirović", "Gazmen Salijević", "", ""], "sq": ["Nenad Rašić", "Radoica Radomirović", "Gazmen Salijević", "", ""], "sr": ["Nenad Rašić", "Radoica Radomirović", "Gazmen Salijević", "", ""] }
    },
    {
        "names": {"en": "Ministry of Regional Development", "sq": "Ministria e Zhvillimit Rajonal", "sr": "Ministarstvo regionalnog razvoja"},
        "abbrs": {"en": "MRD", "sq": "MZHR", "sr": "MRR"},
        "minister": {"en": "Fikrim Damka", "sq": "Fikrim Damka", "sr": "Fikrim Damka"},
        "category_key": "infrastructure",
        "cabinets": { "en": ["Fikrim Damka", "Ali Tafarshiku", "Agonislami Ferati", "", ""], "sq": ["Fikrim Damka", "Ali Tafarshiku", "Agonislami Ferati", "", ""], "sr": ["Fikrim Damka", "Ali Tafaršiku", "Agonislami Ferati", "", ""] }
    }
]
# --- End Test Data ---

# [AI PROMPT]: Explain this pytest fixture `file_db_repo`. What does `@pytest.fixture(scope="function")` mean? How does it set up a temporary file-based SQLite database using `project_init_db` and `project_populate_all_ministry_data`? Why is `os.remove(test_db_filepath)` important in the teardown phase (after `yield`)? What is the `tmp_path` argument?
@pytest.fixture(scope="function")
def file_db_repo(tmp_path): # tmp_path is a built-in pytest fixture
    """
    Pytest fixture for a temporary file-based SQLite database.
    Initializes schema, populates data, and yields a MinistryRepository instance.
    Cleans up the database file afterwards.
    """
    test_db_filename = "test_fixture_temp.db"
    test_db_filepath = os.path.join(tmp_path, test_db_filename)
    
    print(f"\n[Fixture Setup] Creating test database at: {test_db_filepath}")

    try:
        project_init_db(db_path=test_db_filepath)
        # Note: project_populate_all_ministry_data uses its own internal data source.
        # For tests to be 100% aligned with MINISTRIES_TEST_DATA for specific content checks,
        # ensure the data in repositories.py's populate function is identical.
        project_populate_all_ministry_data(db_path=test_db_filepath)
        print(f"[Fixture Setup] Test database initialized and populated: {test_db_filepath}")

        repo = MinistryRepository(db_path=test_db_filepath)
        yield repo

    finally:
        if os.path.exists(test_db_filepath):
            print(f"\n[Fixture Teardown] Removing test database: {test_db_filepath}")
            os.remove(test_db_filepath)
        else:
            print(f"\n[Fixture Teardown] Test database file not found for removal: {test_db_filepath}")


# [AI PROMPT]: Explain this test function `test_get_ministry_by_id_exists`. What does the `file_db_repo` argument do? What are `assert` statements used for in testing? How does this test verify the repository method's behavior against expected data (like a specific ministry name from `MINISTRIES_TEST_DATA`)?
def test_get_ministry_by_id_exists(file_db_repo: MinistryRepository):
    """
    Tests that get_ministry_by_id returns correct data for an existing ministry.
    """
    ministry_id_to_test = 1
    # Expected data from the first item in MINISTRIES_TEST_DATA (assuming IDs are sequential from 1)
    expected_name_en = MINISTRIES_TEST_DATA[0]["names"]["en"] 
    expected_category = MINISTRIES_TEST_DATA[0]["category_key"]

    ministry = file_db_repo.get_ministry_by_id(ministry_id_to_test)

    assert ministry is not None, f"Ministry with ID {ministry_id_to_test} should be found"
    assert isinstance(ministry, dict), "Ministry data should be a dictionary"
    assert ministry['ministry_id'] == ministry_id_to_test, "Ministry ID should match"
    assert 'name_en' in ministry, "The 'name_en' field should be present"
    assert ministry['name_en'] == expected_name_en, f"English name should be '{expected_name_en}'"
    assert ministry['category_key'] == expected_category, f"Category key should be '{expected_category}'"

# [AI PROMPT]: Explain `test_get_ministry_by_id_not_exists`. How does it test the scenario where a ministry ID does not exist in the database using the `file_db_repo` fixture?
def test_get_ministry_by_id_not_exists(file_db_repo: MinistryRepository):
    """
    Tests that get_ministry_by_id returns None for a non-existent ministry.
    """
    non_existent_id = 99999 
    ministry = file_db_repo.get_ministry_by_id(non_existent_id)

    assert ministry is None, f"Ministry with ID {non_existent_id} should not be found, but was {ministry}"

# [AI PROMPT]: Explain `test_get_all_ministries_overview_returns_list`. How does this test verify that the method returns the correct type (list of dicts) and the expected number of items based on the length of `MINISTRIES_TEST_DATA`? How does it check the sorting?
def test_get_all_ministries_overview_returns_list(file_db_repo: MinistryRepository):
    """
    Tests that get_all_ministries_overview returns a list of ministry overviews,
    sorted by English name.
    """
    ministries_from_repo = file_db_repo.get_all_ministries_overview()

    assert isinstance(ministries_from_repo, list), "The result should be a list"
    assert len(ministries_from_repo) == len(MINISTRIES_TEST_DATA), \
        f"Should return {len(MINISTRIES_TEST_DATA)} ministries, but got {len(ministries_from_repo)}"
    
    if ministries_from_repo: 
        first_ministry_repo = ministries_from_repo[0]
        assert isinstance(first_ministry_repo, dict), "Each item in the list should be a dictionary"
        assert 'ministry_id' in first_ministry_repo
        assert 'name_en' in first_ministry_repo
        assert 'category_key' in first_ministry_repo

        # Verify sorting by English name (as implemented in the repository method)
        # Sort our test data the same way to find the expected first item.
        sorted_test_data_by_name = sorted(MINISTRIES_TEST_DATA, key=lambda x: x["names"]["en"])
        expected_first_name_en = sorted_test_data_by_name[0]["names"]["en"]
        assert first_ministry_repo['name_en'] == expected_first_name_en, \
            f"First ministry in overview (sorted by name_en) should be '{expected_first_name_en}', but got '{first_ministry_repo['name_en']}'. Check data and sorting in repository."


# [AI PROMPT]: Write a new test function `test_get_indicators_for_ministry` for the `file_db_repo`. It should verify that indicators are returned for a valid ministry ID, that the result is a list of dictionaries, and that each dictionary contains expected keys like `pillar_key` and `value`.
def test_get_indicators_for_ministry(file_db_repo: MinistryRepository):
    """Tests fetching indicators for a ministry."""
    ministry_id_to_test = 1 
    indicators = file_db_repo.get_indicators_for_ministry(ministry_id_to_test)

    assert isinstance(indicators, list), "Indicators should be a list"
    # Based on population logic, each ministry gets 4 pillar indicators
    assert len(indicators) == 4, f"Expected 4 indicators for ministry {ministry_id_to_test}, got {len(indicators)}"
    
    if indicators:
        first_indicator = indicators[0] # Order might depend on 'ORDER BY pillar_key'
        assert isinstance(first_indicator, dict), "Each indicator should be a dictionary"
        assert 'pillar_key' in first_indicator
        assert 'value' in first_indicator
        assert 'indicator_name_en' in first_indicator 

# [AI PROMPT]: Write a new test function `test_get_kpis_for_ministry` for the `file_db_repo`. It should verify that KPIs are returned for a valid ministry ID, check the type, and ensure expected keys like `kpi_name_key` and `kpi_value_numeric` are present.
def test_get_kpis_for_ministry(file_db_repo: MinistryRepository):
    """Tests fetching KPIs for a ministry."""
    ministry_id_to_test = 1
    kpis = file_db_repo.get_kpis_for_ministry(ministry_id_to_test)

    assert isinstance(kpis, list), "KPIs should be a list"
    # Based on population logic, each ministry gets 9 KPIs in the sample data
    assert len(kpis) == 9, f"Expected 9 KPIs for ministry {ministry_id_to_test}, got {len(kpis)}"

    if kpis:
        first_kpi = kpis[0] # Order might depend on 'ORDER BY period_end_date DESC, kpi_name_key'
        assert isinstance(first_kpi, dict), "Each KPI should be a dictionary"
        assert 'kpi_name_key' in first_kpi
        assert 'kpi_value_numeric' in first_kpi 
        assert 'unit' in first_kpi

# [AI PROMPT]: Write a new test function `test_get_recent_activities_for_ministry` for the `file_db_repo`. It should test fetching recent activities, checking the list length against the default limit (or a specified limit), and verifying the structure of an activity item.
def test_get_recent_activities_for_ministry(file_db_repo: MinistryRepository):
    """Tests fetching recent activities for a ministry."""
    ministry_id_to_test = 1
    limit = 3 # Test with a specific limit
    activities = file_db_repo.get_recent_activities_for_ministry(ministry_id_to_test, limit=limit)

    assert isinstance(activities, list), "Activities should be a list"
    # Population adds 1 to 4 activities. This test expects at most 'limit'.
    # If fewer than 'limit' activities exist, it will return those.
    assert len(activities) <= limit, f"Should return at most {limit} activities, got {len(activities)}"
    assert len(activities) > 0, "Expected some activities to be populated and fetched." # Assuming population adds at least 1

    if activities:
        first_activity = activities[0]
        assert isinstance(first_activity, dict), "Each activity should be a dictionary"
        assert 'title_en' in first_activity
        assert 'activity_date' in first_activity

# [AI PROMPT]: Write a new test function `test_get_dashboard_indicators_by_pillar` for the `file_db_repo`. It should pick a pillar, fetch dashboard data, and verify that the results are a list of dictionaries, each containing ministry info and a 'score', and that the count matches the number of ministries.
def test_get_dashboard_indicators_by_pillar(file_db_repo: MinistryRepository):
    """Tests fetching dashboard indicators for a specific pillar."""
    pillar_to_test = "Transparency" 
    dashboard_items = file_db_repo.get_dashboard_indicators_by_pillar(pillar_to_test)

    assert isinstance(dashboard_items, list), "Dashboard items should be a list"
    assert len(dashboard_items) == len(MINISTRIES_TEST_DATA), \
        f"Expected {len(MINISTRIES_TEST_DATA)} items for pillar '{pillar_to_test}', got {len(dashboard_items)}"

    if dashboard_items:
        first_item = dashboard_items[0] # Order depends on 'ORDER BY score DESC, m.name_en ASC'
        assert isinstance(first_item, dict), "Each dashboard item should be a dictionary"
        assert 'ministry_id' in first_item
        assert 'name_en' in first_item
        assert 'score' in first_item
        assert first_item['pillar_key'] == pillar_to_test 