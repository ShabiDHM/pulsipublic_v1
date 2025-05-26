# pulsi_politik_backend/middleware/security.py

class SecurityHeadersMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        def custom_start_response(status, headers, exc_info=None):
            csp_policy_directives = [
                "default-src 'self'",
                # For style.css (local), Leaflet CSS (local), Tailwind CSS (CDN), and inline styles
                "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
                # For FontAwesome fonts (CDN) and potentially data: URIs for fonts
                "font-src 'self' https://cdn.jsdelivr.net data:",
                # For main_script.js (local), Leaflet JS (local), Chart.js (CDN)
                "script-src 'self' https://cdn.jsdelivr.net",
                # For local images (logo if re-added), data: URIs, AND OpenStreetMap TILES
                "img-src 'self' data: https://*.tile.openstreetmap.org", # <<< MODIFIED HERE
                "frame-ancestors 'none'",
                "object-src 'none'",
                "form-action 'self'",
                "base-uri 'self'",
                "connect-src 'self'", # For API calls to your own backend
                "upgrade-insecure-requests"
            ]
            csp_header_value = "; ".join(csp_policy_directives)

            security_headers = [
                ('Strict-Transport-Security', 'max-age=63072000; includeSubDomains'),
                ('X-Content-Type-Options', 'nosniff'),
                ('X-Frame-Options', 'DENY'), # Changed from SAMEORIGIN to DENY for stronger protection if no framing is needed
                ('Content-Security-Policy', csp_header_value),
                ('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()'),
                ('Referrer-Policy', 'strict-origin-when-cross-origin'),
            ]

            # Filter out any existing CSP headers before adding our own to avoid duplicates.
            headers = [h for h in headers if h[0].lower() != 'content-security-policy']
            headers.extend(security_headers)

            return start_response(status, headers, exc_info)

        return self.app(environ, custom_start_response)