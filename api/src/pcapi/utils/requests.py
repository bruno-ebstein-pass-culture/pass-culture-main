import logging
import re
from typing import Any
from typing import Callable

import requests
from requests import Response
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from pcapi import settings


# fmt: off
# isort: off
# Allow our code to access `requests` exceptions directly from this
# wrapper module.
from requests import exceptions  # pylint: disable=unused-import
# isort: on
# fmt: on

logger = logging.getLogger(__name__)

# See also `SENDINBLUE_REQUEST_TIMEOUT` in `pcapi.core.monkeypatches`
REQUEST_TIMEOUT_IN_SECOND = 10


class ExternalAPIException(Exception):
    is_retryable: bool

    def __init__(self, is_retryable: bool, *args: object) -> None:
        self.is_retryable = is_retryable
        super().__init__(*args)


def _redact_url(url: str) -> str:
    # Cine Digital Service (CDS) wants authentication token to appear in GET
    # requests. We don't want to log them.
    return re.sub("api_token=[^&^$]+", "api_token=[REDACTED]", url)


def _wrapper(request_func: Callable, method: str, url: str, log_at_error_level=True, **kwargs: Any) -> Response:  # type: ignore [no-untyped-def]
    timeout = kwargs.pop("timeout", REQUEST_TIMEOUT_IN_SECOND)
    try:
        response = request_func(method=method, url=url, timeout=timeout, **kwargs)
    except Exception as exc:
        # If the URL is not controlled by us, there is probably no
        # reason to send the error to Sentry. Logging an INFO message
        # is enough if we ever need to debug.
        if log_at_error_level:
            logger_method = logger.exception
        else:
            logger_method = logger.info
        logger_method("Call to external service failed with %s", exc, extra={"method": method, "url": _redact_url(url)})
        raise exc
    else:
        logger.info(
            "External service called",
            extra={
                "url": _redact_url(response.url),
                "statusCode": response.status_code,
                "duration": response.elapsed.total_seconds(),
            },
        )

    return response


def get(url: str, **kwargs: Any) -> Response:
    with Session() as session:
        return session.request(method="GET", url=url, **kwargs)


def post(url: str, **kwargs: Any) -> Response:
    with Session() as session:
        return session.request(method="POST", url=url, **kwargs)


def put(url: str, **kwargs: Any) -> Response:
    with Session() as session:
        return session.request(method="PUT", url=url, **kwargs)


def delete(url: str, **kwargs: Any) -> Response:
    with Session() as session:
        return session.request(method="DELETE", url=url, **kwargs)


class _SessionMixin:
    def request(self, method: str, url: str, *args: Any, **kwargs: Any) -> Response:
        return _wrapper(super().request, method, url, *args, **kwargs)  # type: ignore [misc]


class Session(_SessionMixin, requests.Session):  # type: ignore [misc]
    def __init__(self, *args, **kwargs):  # type: ignore [no-untyped-def]
        super().__init__(*args, **kwargs)
        # Only sets a retry strategy for safe verbs
        safe_retry_strategy = Retry(total=3, allowed_methods=["HEAD", "GET", "OPTIONS"])
        unsafe_retry_strategy = Retry(total=3)
        safe_adapter = HTTPAdapter(max_retries=safe_retry_strategy)
        unsafe_adapter = HTTPAdapter(max_retries=unsafe_retry_strategy)
        self.mount("https://www.demarches-simplifiees.fr", safe_adapter)
        self.mount(settings.UBBLE_API_URL, safe_adapter)
        self.mount("https://api.batch.com", unsafe_adapter)
