# pulsi_politik_backend/errors/handlers.py

from flask import jsonify, Flask # Flask is needed for type hinting app
from http import HTTPStatus
# [AI PROMPT]: Explain the purpose of importing `ApiError` and specific error types like `NotFoundError` into `handlers.py`.
from .exceptions import ApiError, NotFoundError # Import your custom exceptions

# [AI PROMPT]: Explain the `register_error_handlers` function. How does it use `@app.errorhandler()` to associate handler functions with specific exceptions or HTTP status codes?
def register_error_handlers(app: Flask):
    """Registers custom error handlers with the Flask application."""

    # [AI PROMPT]: Explain the `handle_api_error` function. How does it catch any error inheriting from `ApiError`? How does it use the error's `to_dict()` method and `status_code` to create a JSON response?
    @app.errorhandler(ApiError) # Handles any instance of ApiError or its subclasses
    def handle_api_error(error: ApiError):
        """Handles instances of ApiError and its subclasses."""
        app.logger.warning(f"API Error Handled: {error.message} (Status: {error.status_code})", exc_info=False) # Log less verbosely
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    # --- Standard HTTP Error Handlers ---
    # You can override Flask's default handlers for common HTTP errors.

    # [AI PROMPT]: Explain the `handle_not_found_error` function. How does it specifically handle 404 errors, ensuring a consistent JSON response format even for errors not explicitly raised as `NotFoundError`?
    @app.errorhandler(HTTPStatus.NOT_FOUND) # Handles 404 errors
    def handle_not_found_error(error): # The 'error' argument is passed by Flask
        """Handles 404 Not Found errors."""
        # This handler will catch 404s raised by Flask itself (e.g., unknown route)
        # or if you use abort(404).
        # We can wrap this in our custom NotFoundError to use its structure.
        custom_error = NotFoundError(message="The requested URL was not found on the server.")
        app.logger.info(f"404 Not Found: {request.path}")
        response = jsonify(custom_error.to_dict())
        response.status_code = custom_error.status_code
        return response

    # [AI PROMPT]: Explain the `handle_internal_server_error` function. Why is it important to have a generic handler for 500 errors? How does it log the error for debugging?
    @app.errorhandler(HTTPStatus.INTERNAL_SERVER_ERROR) # Handles 500 errors
    def handle_internal_server_error(error):
        """Handles 500 Internal Server Errors (uncaught exceptions)."""
        # This is a fallback for unexpected errors in your application code.
        # It's crucial to log these errors thoroughly for debugging.
        app.logger.error(f"Internal Server Error: {error}", exc_info=True) # Log the full traceback
        
        # For production, you might want to return a more generic message
        # and not expose details of the internal error to the client.
        # During development, error.description might be useful.
        error_payload = {
            "message": "An unexpected internal server error occurred. Please try again later.",
            "status": "error"
        }
        if app.debug and hasattr(error, 'description'): # Only include original description in debug
             error_payload["debug_description"] = str(error.description)

        response = jsonify(error_payload)
        response.status_code = HTTPStatus.INTERNAL_SERVER_ERROR
        return response
    
    # You can add more handlers for other HTTP status codes if needed:
    # @app.errorhandler(HTTPStatus.UNAUTHORIZED)
    # def handle_unauthorized_error(error): ...
    #
    # @app.errorhandler(HTTPStatus.FORBIDDEN)
    # def handle_forbidden_error(error): ...
    
    print("ℹ️ Custom error handlers registered.")

# Need to import request for the 404 handler context
from flask import request