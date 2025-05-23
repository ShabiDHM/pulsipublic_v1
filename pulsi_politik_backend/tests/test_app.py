# pulsi_politik_backend/tests/test_app.py
import pytest
import json

# Import the Flask app instance from your main app module
# This assumes your app instance is named 'app' in pulsi_politik_backend/app.py
# Pytest needs to be able to find your application.
# Running pytest from PULSIPUBLIC_V1/ usually sets up PYTHONPATH correctly.
from pulsi_politik_backend.app import app as flask_app 
# We also need our custom exceptions to check for specific error messages if needed
from pulsi_politik_backend.errors.exceptions import NotFoundError

# [AI PROMPT]: Explain this pytest fixture `app_fixture`. How does it relate to the `flask_app` imported from `app.py`? Why is `app.config.update({"TESTING": True})` important for testing Flask applications?
@pytest.fixture(scope="module") # "module" scope means this fixture runs once per test module (file)
def app_fixture():
    """
    Pytest fixture to configure the Flask app for testing.
    """
    # Set the TESTING flag. This disables error catching during request handling,
    # so you get better error reports when performing test requests against the application.
    flask_app.config.update({
        "TESTING": True,
        # Optionally, override DB_PATH for tests if not using in-memory for integration tests
        # For now, integration tests will use the DB configured by app.py (which should be init-db'd)
        # Or, you could have a separate test config loaded here.
        # "DB_PATH": ":memory:" # This would require init_db for every app_fixture if state is not shared
    })
    # Other test-specific configurations can go here

    yield flask_app # Provide the configured app instance

# [AI PROMPT]: Explain the `client` fixture. How does it use the `app_fixture` to get a Flask test client? What is a test client used for?
@pytest.fixture
def client(app_fixture):
    """
    Pytest fixture to provide a Flask test client for making requests.
    """
    return app_fixture.test_client() # This is Flask's built-in test client

# [AI PROMPT]: Explain `test_dashboard_data_success`. How does it use the `client` to make a GET request? How does it check the HTTP status code and the basic structure of the JSON response?
def test_dashboard_data_success(client):
    """
    Tests the /api/dashboard_data endpoint for a successful response.
    """
    response = client.get('/api/dashboard_data?pillar=Transparency&lang=en')
    
    assert response.status_code == 200, "Should return a 200 OK status"
    assert response.content_type == 'application/json', "Content type should be JSON"
    
    data = json.loads(response.data) # Or response.get_json()
    assert 'ministries' in data, "Response should contain a 'ministries' key"
    assert isinstance(data['ministries'], list), "'ministries' should be a list"
    if data['ministries']: # If the list isn't empty
        assert 'id' in data['ministries'][0]
        assert 'name' in data['ministries'][0]
        assert 'score' in data['ministries'][0]
        assert data['ministries'][0]['name'] is not None # Name should be populated due to lang=en

# [AI PROMPT]: Explain `test_ministry_details_success`. How does it test a specific ministry's details? What kind of assertions are made?
def test_ministry_details_success(client):
    """
    Tests the /api/ministry_details/<id> endpoint for an existing ministry.
    """
    ministry_id = 1 # Assuming ministry ID 1 exists from population
    response = client.get(f'/api/ministry_details/{ministry_id}?lang=en')

    assert response.status_code == 200
    assert response.content_type == 'application/json'
    
    data = response.get_json()
    assert 'profile' in data
    assert data['profile']['ministry_id'] == ministry_id
    assert data['profile']['name'] is not None # Should be populated with English name
    assert 'indicators' in data
    assert 'kpis' in data
    assert 'activities' in data

# [AI PROMPT]: Explain `test_ministry_details_not_found`. How does it test the 404 error case? How does it verify the error message structure defined by our custom error handlers?
def test_ministry_details_not_found(client):
    """
    Tests the /api/ministry_details/<id> endpoint for a non-existent ministry.
    It should return a 404 with our custom JSON error format.
    """
    non_existent_id = 99999
    response = client.get(f'/api/ministry_details/{non_existent_id}?lang=en')

    assert response.status_code == 404, "Should return a 404 Not Found status"
    assert response.content_type == 'application/json'
    
    data = response.get_json()
    assert 'status' in data and data['status'] == 'error'
    assert 'message' in data
    # Check if the message matches what NotFoundError should produce
    # This depends on how your NotFoundError is defined and handled
    assert f"Ministry with ID {non_existent_id} not found" in data['message']

# [AI PROMPT]: Explain `test_non_existent_route_404`. How does this test verify that requests to undefined API routes are handled correctly by the 404 error handler?
def test_non_existent_route_404(client):
    """
    Tests that a request to a completely non-existent route returns a 404
    in our custom JSON error format.
    """
    response = client.get('/api/this/route/does/not/exist')

    assert response.status_code == 404
    assert response.content_type == 'application/json'
    data = response.get_json()
    assert 'status' in data and data['status'] == 'error'
    assert "The requested URL was not found on the server" in data['message']

# Add more integration tests:
# - Test language switching for both endpoints.
# - Test different pillars for dashboard_data.
# - If you had POST/PUT endpoints, test them with valid and invalid data.