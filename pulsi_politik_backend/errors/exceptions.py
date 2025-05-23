# pulsi_politik_backend/errors/exceptions.py

from http import HTTPStatus # For standard HTTP status codes
from typing import Optional, List, Dict, Any # For type hinting

# [AI PROMPT]: Explain the purpose of the `ApiError` base class. Why does it inherit from `Exception`? What are the `message`, `status_code`, and `payload` attributes for? How is the `to_dict()` method used by error handlers?
class ApiError(Exception):
    """Base class for custom API errors handled by the application."""
    # Default status code if not overridden by a subclass or instance
    status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR
    # Default message if not overridden
    message: str = "An unexpected API error occurred."
    # Optional additional data to include in the error response (e.g., validation details)
    payload: Optional[Dict[str, Any]] = None

    def __init__(self, 
                 message: Optional[str] = None, 
                 status_code: Optional[int] = None, 
                 payload: Optional[Dict[str, Any]] = None):
        """
        Initializes the ApiError instance.
        Allows overriding default message, status_code, and providing a payload.
        """
        super().__init__(message or self.message) # Call the base Exception's __init__ with the message
        
        # Set instance-specific attributes if provided, otherwise use class defaults
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code
        if payload is not None:
            self.payload = payload

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes the error information to a dictionary format suitable for a JSON response.
        """
        rv = dict(self.payload or {}) # Start with payload if it exists, otherwise an empty dict
        rv['message'] = self.message
        rv['status'] = 'error' # Consistently indicate it's an error response
        # Optionally, include the status code in the response body as well:
        # rv['code'] = self.status_code 
        return rv

# --- Specific API Error Classes ---
# These inherit from ApiError and pre-define common HTTP error scenarios.

# [AI PROMPT]: Explain the `NotFoundError` class. How does it inherit from `ApiError` and override the default `status_code` and `message`? Give an example of when you would raise this error in a Flask route.
class NotFoundError(ApiError):
    """Raised when a requested resource is not found (maps to HTTP 404)."""
    status_code = HTTPStatus.NOT_FOUND # 404
    message = "The requested resource was not found."

# [AI PROMPT]: Explain the `BadRequestError` class. When would this error be appropriate to raise in a Flask application (e.g., invalid input parameters, malformed request body)?
class BadRequestError(ApiError):
    """Raised for malformed or invalid client requests (maps to HTTP 400)."""
    status_code = HTTPStatus.BAD_REQUEST # 400
    message = "The request was malformed or contained invalid parameters."

# [AI PROMPT]: Explain the `ValidationError` class, specifically designed for data validation failures (e.g., from Pydantic). How could its `payload` (specifically the 'details' key) be used to return detailed validation error messages to the client? Why might HTTP 422 be used instead of 400?
class ValidationError(ApiError):
    """
    Raised when input data validation fails (maps to HTTP 422 Unprocessable Entity 
    or sometimes 400 Bad Request).
    """
    status_code = HTTPStatus.UNPROCESSABLE_ENTITY # 422
    message = "Input data validation failed."

    def __init__(self, 
                 errors: Optional[List[Dict[str, Any]]] = None, 
                 message: Optional[str] = None):
        """
        Initializes the ValidationError.
        'errors' can be a list of detailed error dictionaries (e.g., from Pydantic's .errors()).
        """
        # If detailed errors are provided, include them in the payload.
        current_payload = {"details": errors} if errors else None
        # Call the parent ApiError's __init__ method.
        super().__init__(message=message or self.message, 
                         status_code=self.status_code, 
                         payload=current_payload)

# [AI PROMPT]: Explain the `UnauthorizedError` class. What is the difference between an HTTP 401 Unauthorized error and an HTTP 403 Forbidden error?
class UnauthorizedError(ApiError):
    """
    Raised when authentication is required and has failed or has not yet been provided 
    (maps to HTTP 401).
    """
    status_code = HTTPStatus.UNAUTHORIZED # 401
    message = "Authentication is required and has failed or has not yet been provided."

# [AI PROMPT]: Explain the `ForbiddenError` class. When would an application raise an HTTP 403 Forbidden error as opposed to a 401 Unauthorized error?
class ForbiddenError(ApiError):
    """
    Raised when the server understands the request but refuses to authorize it,
    often because the authenticated user lacks necessary permissions 
    (maps to HTTP 403).
    """
    status_code = HTTPStatus.FORBIDDEN # 403
    message = "You do not have permission to access this resource or perform this action."

# Example of another custom error if needed:
# class ServiceUnavailableError(ApiError):
#     """Raised when a downstream service is unavailable (maps to HTTP 503)."""
#     status_code = HTTPStatus.SERVICE_UNAVAILABLE # 503
#     message = "A required service is temporarily unavailable. Please try again later."