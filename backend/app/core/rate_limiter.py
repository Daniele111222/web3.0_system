"""用于 API 保护的限流中间件。"""
import asyncio
import time
import logging
from collections import defaultdict
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RateLimiter:
    """使用滑动窗口和内存清理的线程安全内存限流器。"""
    
    def __init__(
        self,
        requests_per_minute: int = 120,
        requests_per_hour: int = 1000,
        cleanup_interval: int = 300,  # 每 5 分钟清理一次旧条目
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.cleanup_interval = cleanup_interval
        # 存储：{ip: [(timestamp, count), ...]}
        self._minute_requests: Dict[str, list] = defaultdict(list)
        self._hour_requests: Dict[str, list] = defaultdict(list)
        self._last_cleanup = time.time()
        # 用于线程安全的异步锁
        self._lock = asyncio.Lock()
    
    def _clean_old_requests(
        self,
        requests: list,
        window_seconds: int,
        current_time: float,
    ) -> list:
        """移除时间窗口外的请求。"""
        cutoff = current_time - window_seconds
        return [r for r in requests if r > cutoff]
    
    def _cleanup_old_ips(self, current_time: float) -> None:
        """移除没有近期请求的 IP 条目以防止内存泄漏。"""
        # 清理分钟请求
        empty_ips = [
            ip for ip, requests in self._minute_requests.items()
            if not requests or all(r < current_time - 60 for r in requests)
        ]
        for ip in empty_ips:
            del self._minute_requests[ip]
        
        # 清理小时请求
        empty_ips = [
            ip for ip, requests in self._hour_requests.items()
            if not requests or all(r < current_time - 3600 for r in requests)
        ]
        for ip in empty_ips:
            del self._hour_requests[ip]
        
        if empty_ips:
            logger.debug(f"已从限流器中清理 {len(empty_ips)} 个陈旧的 IP 条目")
    
    async def is_allowed(self, client_ip: str) -> Tuple[bool, str, Optional[int]]:
        """
        检查给定 IP 的请求是否被允许。
        返回：(是否允许, 消息, 重试等待秒数)
        """
        async with self._lock:
            current_time = time.time()
            
            # 定期清理旧的 IP 条目以防止内存泄漏
            if current_time - self._last_cleanup > self.cleanup_interval:
                self._cleanup_old_ips(current_time)
                self._last_cleanup = current_time
            
            # 清理并检查分钟窗口
            self._minute_requests[client_ip] = self._clean_old_requests(
                self._minute_requests[client_ip], 60, current_time
            )
            if len(self._minute_requests[client_ip]) >= self.requests_per_minute:
                # 计算重试等待时间
                oldest_request = min(self._minute_requests[client_ip])
                retry_after = int(oldest_request + 60 - current_time) + 1
                return False, "每分钟请求过多", max(1, retry_after)
            
            # 清理并检查小时窗口
            self._hour_requests[client_ip] = self._clean_old_requests(
                self._hour_requests[client_ip], 3600, current_time
            )
            if len(self._hour_requests[client_ip]) >= self.requests_per_hour:
                oldest_request = min(self._hour_requests[client_ip])
                retry_after = int(oldest_request + 3600 - current_time) + 1
                return False, "每小时请求过多", max(1, retry_after)
            
            # 记录请求
            self._minute_requests[client_ip].append(current_time)
            self._hour_requests[client_ip].append(current_time)
            
            return True, "", None
    
    async def get_remaining(self, client_ip: str) -> Dict[str, int]:
        """获取客户端的剩余请求数。"""
        async with self._lock:
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


# 全局限流器实例
rate_limiter = RateLimiter()

# 针对认证端点的更严格限流器
auth_rate_limiter = RateLimiter(requests_per_minute=10, requests_per_hour=100)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """应用限流并正确处理错误的中间件。"""
    
    async def dispatch(self, request: Request, call_next):
        # 更好地获取客户端 IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # 获取链中的第一个 IP（原始客户端）
            client_ip = forwarded.split(",")[0].strip()
        elif request.client:
            client_ip = request.client.host
        else:
            # 为未知客户端生成临时标识符
            # 这可以防止所有未知客户端共享相同的限制
            client_ip = f"unknown_{id(request)}"
        
        # 对认证端点使用更严格的限制
        path = request.url.path
        if path.startswith("/api/v1/auth"):
            limiter = auth_rate_limiter
        else:
            limiter = rate_limiter
        
        # 检查限流
        try:
            allowed, message, retry_after = await limiter.is_allowed(client_ip)
        except Exception as e:
            logger.error(f"限流器错误：{e}")
            # 失败开放 - 如果限流器失败则允许请求
            allowed = True
            message = ""
            retry_after = None
        
        if not allowed:
            headers = {}
            if retry_after:
                headers["Retry-After"] = str(retry_after)
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"message": message, "code": "RATE_LIMIT_EXCEEDED"},
                headers=headers,
            )
        
        # 添加限流响应头
        try:
            response = await call_next(request)
            remaining = await limiter.get_remaining(client_ip)
            response.headers["X-RateLimit-Remaining-Minute"] = str(remaining["minute_remaining"])
            response.headers["X-RateLimit-Remaining-Hour"] = str(remaining["hour_remaining"])
            return response
        except Exception as e:
            # 如果异常已经被处理（如验证错误），直接抛出
            raise
