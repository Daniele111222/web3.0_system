"""Rate limiting middleware for API protection."""
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimiter:
    """Simple in-memory rate limiter using sliding window."""
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        # Store: {ip: [(timestamp, count), ...]}
        self._minute_requests: Dict[str, list] = defaultdict(list)
        self._hour_requests: Dict[str, list] = defaultdict(list)
    
    def _clean_old_requests(
        self,
        requests: list,
        window_seconds: int,
        current_time: float,
    ) -> list:
        """Remove requests outside the time window."""
        cutoff = current_time - window_seconds
        return [r for r in requests if r > cutoff]
    
    def is_allowed(self, client_ip: str) -> Tuple[bool, str]:
        """Check if request is allowed for the given IP."""
        current_time = time.time()
        
        # Clean and check minute window
        self._minute_requests[client_ip] = self._clean_old_requests(
            self._minute_requests[client_ip], 60, current_time
        )
        if len(self._minute_requests[client_ip]) >= self.requests_per_minute:
            return False, "Too many requests per minute"
        
        # Clean and check hour window
        self._hour_requests[client_ip] = self._clean_old_requests(
            self._hour_requests[client_ip], 3600, current_time
        )
        if len(self._hour_requests[client_ip]) >= self.requests_per_hour:
            return False, "Too many requests per hour"
        
        # Record request
        self._minute_requests[client_ip].append(current_time)
        self._hour_requests[client_ip].append(current_time)
        
        return True, ""
    
    def get_remaining(self, client_ip: str) -> Dict[str, int]:
        """Get remaining requests for the client."""
        current_time = time.time()
        
        minute_requests = self._clean_old_requests(
            self._minute_requests.get(client_ip, []), 60, current_time
        )
        hour_requests = self._clean_old_requests(
            self._hour_requests.get(client_ip, []), 3600, current_time
        )
        
        return {
            "minute_remaining": max(0, self.requests_per_minute - len(minute_requests)),
            "hour_remaining": max(0, self.requests_per_hour - len(hour_requests)),
        }


# Global rate limiter instance
rate_limiter = RateLimiter()

# Stricter limiter for auth endpoints
auth_rate_limiter = RateLimiter(requests_per_minute=10, requests_per_hour=100)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to apply rate limiting."""
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        # Use stricter limits for auth endpoints
        path = request.url.path
        if path.startswith("/api/v1/auth"):
            limiter = auth_rate_limiter
        else:
            limiter = rate_limiter
        
        # Check rate limit
        allowed, message = limiter.is_allowed(client_ip)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"message": message, "code": "RATE_LIMIT_EXCEEDED"},
            )
        
        # Add rate limit headers
        response = await call_next(request)
        remaining = limiter.get_remaining(client_ip)
        response.headers["X-RateLimit-Remaining-Minute"] = str(remaining["minute_remaining"])
        response.headers["X-RateLimit-Remaining-Hour"] = str(remaining["hour_remaining"])
        
        return response
