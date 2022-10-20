from unittest.mock import MagicMock
from unittest.mock import Mock
from unittest.mock import call
from unittest.mock import patch

from google.cloud import tasks_v2
import pytest

from pcapi import settings
from pcapi.core.testing import override_settings
from pcapi.models.api_errors import ApiErrors
from pcapi.routes.serialization import BaseModel
from pcapi.tasks.decorator import task
from pcapi.utils import requests

from tests.conftest import TestClient


class VoidTaskPayload(BaseModel):
    chouquette_price: int


def generate_task(f):
    TEST_QUEUE = "test-queue"

    @task(TEST_QUEUE, "/void_task")
    def test_task(payload: VoidTaskPayload):
        f(payload)

    return test_task


endpoint_method = Mock()


@task("endpoint-test-queue", "/endpoint_test")
def cloud_task_test_endpoint(body):
    endpoint_method(body)


class CloudTaskDecoratorTest:
    def test_calling_task(self):
        inner_task = MagicMock()
        test_task = generate_task(inner_task)
        payload = VoidTaskPayload(chouquette_price=12)

        # Synchronous call
        test_task(payload)
        # Asynchronous call, but synchronous in tests
        test_task.delay(payload)

        assert inner_task.call_args_list == [call(payload), call(payload)]

    @patch("pcapi.tasks.cloud_task.AUTHORIZATION_HEADER_VALUE", "Bearer secret-token")
    @override_settings(IS_RUNNING_TESTS=False)
    @patch("pcapi.tasks.cloud_task.requests.post")
    def test_calling_task_in_dev(self, requests_post):
        inner_task = MagicMock()
        test_task = generate_task(inner_task)
        payload = VoidTaskPayload(chouquette_price=12)

        # Synchronous call
        test_task(payload)
        requests_post.assert_not_called()

        # Asynchronous call
        test_task.delay(payload)
        requests_post.assert_called_once_with(
            "http://localhost:5001/cloud-tasks/void_task",
            headers={"HTTP_X_CLOUDTASKS_QUEUENAME": "test-queue", "AUTHORIZATION": "Bearer secret-token"},
            json={"chouquette_price": 12},
        )

    @patch("pcapi.tasks.cloud_task.AUTHORIZATION_HEADER_VALUE", "Bearer secret-token")
    @override_settings(IS_RUNNING_TESTS=False)
    @override_settings(IS_DEV=False)
    def test_calling_google_cloud_task_client(self, cloud_task_client):
        inner_task = MagicMock()
        test_task = generate_task(inner_task)
        payload = VoidTaskPayload(chouquette_price=12)

        test_task.delay(payload)

        cloud_task_client.create_task.assert_called_once()

        _, call_args = cloud_task_client.create_task.call_args

        assert call_args["request"]["task"]["http_request"] == {
            "body": b'{"chouquette_price": 12}',
            "headers": {"AUTHORIZATION": "Bearer " "secret-token", "Content-type": "application/json"},
            "http_method": tasks_v2.HttpMethod.POST,
            "url": f"{settings.API_URL}/cloud-tasks/void_task",
        }

    @patch("pcapi.tasks.decorator.cloud_task_api.route")
    def test_creates_a_handler_endoint(self, route_helper, app):
        route_wrapper = MagicMock()
        route_helper.return_value = route_wrapper

        inner_task = MagicMock()
        generate_task(inner_task)

        route_helper.assert_called_once_with("/void_task", methods=["POST"], endpoint="/void_task")

        route_function = route_wrapper.call_args_list[0].args[0]

        with pytest.raises(ApiErrors) as e:
            route_function({})
        assert e.value.errors["chouquette_price"] == ["Ce champ est obligatoire"]

    @patch("pcapi.tasks.cloud_task.AUTHORIZATION_HEADER_VALUE", "Bearer secret-token")
    def test_authorization(self, client: TestClient):
        endpoint_method.reset_mock()

        response = client.post("/cloud-tasks/endpoint_test", headers={"AUTHORIZATION": "Bearer secret-token"})

        assert response.status_code == 204
        endpoint_method.assert_called_once()

    def test_unauthorized(self, client: TestClient):
        endpoint_method.reset_mock()

        response = client.post("/cloud-tasks/endpoint_test", headers={"AUTHORIZATION": "Bearer wrong-token"})

        assert response.status_code == 299
        endpoint_method.assert_not_called()


class PostHandlerTest:
    @patch("pcapi.tasks.cloud_task.AUTHORIZATION_HEADER_VALUE", "Bearer secret-token")
    def test_max_attempt_reached(self, client: TestClient, caplog):
        endpoint_method.reset_mock()
        endpoint_method.side_effect = requests.ExternalAPIException(is_retryable=True)

        response = client.post(
            "/cloud-tasks/endpoint_test",
            headers={"AUTHORIZATION": "Bearer secret-token", "X-CloudTasks-TaskRetryCount": "9"},
        )

        assert response.status_code == 400
        assert len(caplog.records) == 1
        assert caplog.records[0].message == "External API unavailable for CloudTask /endpoint_test"
        assert caplog.records[0].levelname == "ERROR"

    @patch("pcapi.tasks.cloud_task.AUTHORIZATION_HEADER_VALUE", "Bearer secret-token")
    def test_max_attempt_not_reached(self, client: TestClient, caplog):
        endpoint_method.reset_mock()
        endpoint_method.side_effect = requests.ExternalAPIException(is_retryable=True)

        response = client.post(
            "/cloud-tasks/endpoint_test",
            headers={"AUTHORIZATION": "Bearer secret-token", "X-CloudTasks-TaskRetryCount": "8"},
        )

        assert response.status_code == 400
        assert len(caplog.records) == 1
        assert (
            caplog.records[0].message == "The cloud task has failed and will automatically be retried: /endpoint_test"
        )
        assert caplog.records[0].levelname == "WARNING"

    @patch("pcapi.tasks.cloud_task.AUTHORIZATION_HEADER_VALUE", "Bearer secret-token")
    def test_not_retryable(self, client: TestClient):
        endpoint_method.reset_mock()
        endpoint_method.side_effect = requests.ExternalAPIException(is_retryable=False)

        response = client.post(
            "/cloud-tasks/endpoint_test",
            headers={"AUTHORIZATION": "Bearer secret-token", "X-CloudTasks-TaskRetryCount": "8"},
        )

        assert response.status_code == 204
