"""Pinata IPFS service wrapper."""

import json
import logging
import os
import time
from functools import wraps
from typing import Optional, Union

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)


MAX_FILE_SIZE = 50 * 1024 * 1024
DEFAULT_TIMEOUT = 60
MAX_RETRIES = 3
RETRY_DELAY = 1

PINATA_API_URL = "https://api.pinata.cloud"
PINATA_IPFS_GATEWAY = settings.PINATA_GATEWAY_URL.rstrip("/")
ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".pdf",
    ".txt",
    ".json",
    ".mp4",
    ".mp3",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".zip",
    ".rar",
    ".7z",
}


def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower() if filename else ""


def _stringify_metadata_value(value: object) -> Union[str, int, float, bool]:
    """Convert metadata values to Pinata-compatible scalar values."""
    if isinstance(value, (str, int, float, bool)):
        return value
    if value is None:
        return ""
    return json.dumps(value, ensure_ascii=False, default=str)


class PinataError(Exception):
    """Base Pinata error."""


class PinataUploadError(PinataError):
    """Raised when uploading to Pinata fails."""


class PinataDeleteError(PinataError):
    """Raised when deleting a Pinata pin fails."""


class PinataFileTooLargeError(PinataError):
    """Raised when the file exceeds the configured size limit."""


def retry_on_error(max_retries: int = MAX_RETRIES, delay: float = RETRY_DELAY):
    """Retry transient Pinata operations with exponential backoff."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (requests.RequestException, PinataError) as exc:
                    last_exception = exc
                    if attempt < max_retries - 1:
                        wait_time = delay * (2 ** attempt)
                        logger.warning(
                            "pinata_retry_scheduled",
                            extra={
                                "asset_id": "",
                                "cid": "",
                                "file_name": "",
                                "operation": func.__name__,
                                "attempt": attempt + 1,
                                "max_retries": max_retries,
                                "wait_seconds": wait_time,
                                "error": str(exc),
                            },
                        )
                        time.sleep(wait_time)
                    else:
                        logger.error(
                            "pinata_retry_exhausted",
                            extra={
                                "asset_id": "",
                                "cid": "",
                                "file_name": "",
                                "operation": func.__name__,
                                "max_retries": max_retries,
                                "error": str(exc),
                            },
                        )
            raise last_exception

        return wrapper

    return decorator


class PinataService:
    """Pinata IPFS service."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        jwt_token: Optional[str] = None,
        max_file_size: int = MAX_FILE_SIZE,
        timeout: int = DEFAULT_TIMEOUT,
    ):
        self.api_key = api_key or settings.PINATA_API_KEY or None
        self.api_secret = api_secret or settings.PINATA_API_SECRET or None
        self.jwt_token = jwt_token or settings.PINATA_JWT_TOKEN or None
        self.max_file_size = max_file_size
        self.timeout = timeout

        if not self.jwt_token and not (self.api_key and self.api_secret):
            logger.warning("pinata_credentials_missing")

    def _get_headers(self) -> dict:
        if self.jwt_token:
            return {
                "Authorization": f"Bearer {self.jwt_token}",
                "Accept": "application/json",
            }
        if self.api_key and self.api_secret:
            return {
                "pinata_api_key": self.api_key,
                "pinata_secret_api_key": self.api_secret,
                "Accept": "application/json",
            }
        raise PinataError("未配置 Pinata 凭证")

    def _check_file_size(self, file_content: bytes) -> None:
        file_size = len(file_content)
        if file_size > self.max_file_size:
            raise PinataFileTooLargeError(
                f"文件大小（{file_size} 字节）超过最大允许大小（{self.max_file_size} 字节）"
            )

    def _build_url(self, endpoint: str) -> str:
        return f"{PINATA_API_URL}{endpoint}"

    def _build_pinata_metadata(
        self,
        file_name: str,
        metadata: Optional[dict] = None,
    ) -> str:
        payload = {"name": file_name}
        if metadata:
            payload["keyvalues"] = {
                key: _stringify_metadata_value(value)
                for key, value in metadata.items()
            }
        return json.dumps(payload, ensure_ascii=False)

    @retry_on_error()
    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        metadata: Optional[dict] = None,
    ) -> dict:
        self._check_file_size(file_content)

        try:
            response = requests.post(
                self._build_url("/pinning/pinFileToIPFS"),
                headers=self._get_headers(),
                files={"file": (file_name, file_content)},
                data={"pinataMetadata": self._build_pinata_metadata(file_name, metadata)},
                timeout=self.timeout,
            )
            response.raise_for_status()
            result = response.json()

            logger.info(
                "pinata_upload_succeeded",
                extra={
                    "asset_id": "",
                    "cid": result.get("IpfsHash"),
                    "file_name": file_name,
                    "size": len(file_content),
                },
            )

            return {
                "cid": result.get("IpfsHash"),
                "size": result.get("PinSize"),
                "timestamp": result.get("Timestamp"),
                "gateway_url": f"{PINATA_IPFS_GATEWAY}/{result.get('IpfsHash')}",
                "name": file_name,
            }
        except PinataFileTooLargeError:
            raise
        except requests.RequestException as exc:
            response_text = ""
            if getattr(exc, "response", None) is not None:
                try:
                    response_text = exc.response.text
                except Exception:
                    response_text = ""

            logger.error(
                "pinata_upload_failed",
                extra={
                    "asset_id": "",
                    "cid": "",
                    "file_name": file_name,
                    "error": str(exc),
                    "response_text": response_text,
                },
            )

            message = f"上传失败：{str(exc)}"
            if response_text:
                message = f"{message}，响应内容：{response_text}"
            raise PinataUploadError(message) from exc
        except Exception as exc:
            logger.error(
                "pinata_upload_failed",
                extra={
                    "asset_id": "",
                    "cid": "",
                    "file_name": file_name,
                    "error": str(exc),
                },
            )
            raise PinataUploadError(f"上传失败：{str(exc)}") from exc

    @retry_on_error()
    def upload_json(
        self,
        json_data: dict,
        name: str = "data.json",
        metadata: Optional[dict] = None,
    ) -> dict:
        try:
            json_bytes = json.dumps(json_data, ensure_ascii=False).encode("utf-8")
            return self.upload_file(json_bytes, name, metadata)
        except PinataUploadError:
            raise
        except Exception as exc:
            logger.error(
                "pinata_json_upload_failed",
                extra={
                    "asset_id": "",
                    "cid": "",
                    "file_name": name,
                    "error": str(exc),
                },
            )
            raise PinataUploadError(f"JSON 上传失败：{str(exc)}") from exc

    @retry_on_error()
    def delete_file(self, cid: str) -> bool:
        if not cid:
            logger.warning(
                "pinata_delete_skipped_empty_cid",
                extra={"asset_id": "", "cid": "", "file_name": ""},
            )
            return False

        try:
            response = requests.delete(
                self._build_url(f"/pinning/unpin/{cid}"),
                headers=self._get_headers(),
                timeout=self.timeout,
            )
            if response.status_code in {200, 404}:
                logger.info(
                    "pinata_delete_succeeded",
                    extra={"asset_id": "", "cid": cid, "file_name": ""},
                )
                return True
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.error(
                "pinata_delete_failed",
                extra={"asset_id": "", "cid": cid, "file_name": "", "error": str(exc)},
            )
            raise PinataDeleteError(f"删除失败：{str(exc)}") from exc

        return False

    def get_gateway_url(self, cid: str) -> str:
        return f"{PINATA_IPFS_GATEWAY}/{cid}"


_pinata_service: Optional[PinataService] = None


def get_pinata_service() -> PinataService:
    """Get the shared Pinata service instance."""
    global _pinata_service
    if _pinata_service is None:
        _pinata_service = PinataService()
    return _pinata_service
