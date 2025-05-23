# pulsi_politik_backend/middleware/security.py

class SecurityHeadersMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def custom_start_response(status, headers, exc_info=None):
            csp_policy_directives = [
                "default-src 'self'",
                "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'", 
                "font-src 'self' https://cdn.jsdelivr.net data:",
                # +++ MODIFIED LINE BELOW +++
                "script-src 'self' https://cdn.jsdelivr.net", # Added https://cdn.jsdelivr.net
                # +++ END OF MODIFIED LINE +++
                "img-src 'self' data:", 
                "frame-ancestors 'none'", 
                "object-src 'none'",      
                "form-action 'self'",     
                "base-uri 'self'",        
                "connect-src 'self'",     
                "upgrade-insecure-requests" 
            ]
            csp_header_value = "; ".join(csp_policy_directives)

            security_headers = [
                ('Strict-Transport-Security', 'max-age=63072000; includeSubDomains'),
                ('X-Content-Type-Options', 'nosniff'),
                ('X-Frame-Options', 'DENY'), 
                ('Content-Security-Policy', csp_header_value),
                ('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()'),
                ('Referrer-Policy', 'strict-origin-when-cross-origin'),
            ]
            
            headers.extend(security_headers)
            return start_response(status, headers, exc_info)

        return self.app(environ, custom_start_response)