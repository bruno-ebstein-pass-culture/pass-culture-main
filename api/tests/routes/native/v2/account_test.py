from datetime import datetime
from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs
from urllib.parse import urlparse

import pytest

from pcapi.core import token as token_utils
import pcapi.core.mails.testing as mails_testing
from pcapi.core.testing import override_settings
from pcapi.core.users import factories as users_factories
from pcapi.core.users import models as users_models
import pcapi.core.users.constants as users_constants
from pcapi.routes.native.v1.api_errors import account as account_errors


pytestmark = pytest.mark.usefixtures("db_session")


class UpdateUserEmailTest:
    identifier = "email@example.com"

    def test_update_user_email(self, client):
        user = users_factories.BeneficiaryGrant18Factory(email=self.identifier)

        response = client.with_token(user.email).post("/native/v2/profile/update_email")

        assert response.status_code == 204, response.json

        user = users_models.User.query.filter_by(email=self.identifier).one()
        assert user.email == self.identifier  # email not updated until validation link is used
        assert len(mails_testing.outbox) == 1  # one confirmation email to the current address

        base_url_params = _get_last_sent_email_url_params()
        assert {"token", "expiration_timestamp"} <= base_url_params.keys()

    def test_update_email_user_not_connected(self, app, client):
        response = client.post("/native/v2/profile/update_email")

        assert response.status_code == 401, response.json

    @override_settings(MAX_EMAIL_UPDATE_ATTEMPTS=1)
    @patch("pcapi.core.users.email.update.check_no_ongoing_email_update_request")
    def test_update_email_too_many_attempts(self, _ongoing_email_check_mock, client):
        user = users_factories.UserFactory()

        response = client.with_token(user.email).post("/native/v2/profile/update_email")
        assert response.status_code == 204
        response = client.with_token(user.email).post("/native/v2/profile/update_email")

        assert response.status_code == 400
        assert response.json["error_code"] == account_errors.EMAIL_UPDATE_LIMIT.code
        assert response.json["message"] == account_errors.EMAIL_UPDATE_LIMIT.message

    def test_ongoing_email_update_blocks_the_next_update_request(self, client):
        user = users_factories.UserFactory()

        first_response = client.with_token(user.email).post("/native/v2/profile/update_email")
        assert first_response.status_code == 204
        second_response = client.with_token(user.email).post("/native/v2/profile/update_email")

        assert second_response.status_code == 400
        assert second_response.json["error_code"] == account_errors.EMAIL_UPDATE_PENDING.code
        assert second_response.json["message"] == account_errors.EMAIL_UPDATE_PENDING.message


class ConfirmUserEmailUpdateTest:
    def test_email_update_confirmation(self, client):
        user = users_factories.BeneficiaryGrant18Factory()
        token = token_utils.Token.create(
            type_=token_utils.TokenType.EMAIL_CHANGE_CONFIRMATION,
            ttl=users_constants.EMAIL_CHANGE_TOKEN_LIFE_TIME,
            user_id=user.id,
        ).encoded_token

        response = client.post("/native/v2/profile/email_update/confirm", json={"token": token})

        assert response.status_code == 200, response.json
        assert "newEmailSelectionToken" in response.json
        assert token_utils.Token.token_exists(token_utils.TokenType.EMAIL_CHANGE_NEW_EMAIL_SELECTION, user.id)

        # ensure the access token is valid
        protected_response = client.get(
            "/native/v1/me", headers={"Authorization": f'Bearer {response.json["accessToken"]}'}
        )
        assert protected_response.status_code == 200

        # ensure the refresh token is valid
        refresh_response = client.post(
            "/native/v1/refresh_access_token",
            headers={"Authorization": f'Bearer {response.json["refreshToken"]}'},
        )
        assert refresh_response.status_code == 200

    def test_email_update_confirmation_with_invalid_token(self, client):
        response = client.post("/native/v2/profile/email_update/confirm", json={"token": "invalid token"})

        assert response.status_code == 401, response.json
        assert response.json["code"] == "INVALID_TOKEN"


class NewEmailSelectionTest:
    def test_new_email_selection(self, client):
        user = users_factories.BeneficiaryGrant18Factory()
        token = token_utils.Token.create(
            type_=token_utils.TokenType.EMAIL_CHANGE_NEW_EMAIL_SELECTION,
            ttl=users_constants.EMAIL_CHANGE_TOKEN_LIFE_TIME,
            user_id=user.id,
        ).encoded_token

        new_email = "alice@example.com"
        response = client.with_token(user.email).post(
            "/native/v2/profile/email_update/new_email", json={"token": token, "newEmail": new_email}
        )

        assert response.status_code == 204, response.json
        assert not token_utils.Token.token_exists(token_utils.TokenType.EMAIL_CHANGE_NEW_EMAIL_SELECTION, user.id)

        assert len(mails_testing.outbox) == 1
        assert mails_testing.outbox[0]["params"]["FIRSTNAME"] == user.firstName

        base_url_params = _get_last_sent_email_url_params()
        assert {"new_email", "token", "expiration_timestamp"} <= base_url_params.keys()
        assert base_url_params["new_email"] == [new_email]

    def test_email_selection_with_invalid_token(self, client):
        user = users_factories.BeneficiaryGrant18Factory()

        response = client.with_token(user.email).post(
            "/native/v2/profile/email_update/new_email",
            json={"token": "invalid token", "newEmail": "alice@example.com"},
        )

        assert response.status_code == 401, response.json
        assert response.json["code"] == "INVALID_TOKEN"

    def test_email_selection_unauthentified(self, client):
        response = client.post(
            "/native/v2/profile/email_update/new_email",
            json={"token": "invalid token", "newEmail": "alice@example.com"},
        )

        assert response.status_code == 401, response.json


class EmailUpdateStatusTest:
    def test_update_request_status(self, client):
        user = users_factories.BeneficiaryGrant18Factory()
        users_factories.EmailUpdateEntryFactory(user=user, newUserEmail=None, newDomainEmail=None)
        token = token_utils.Token.create(
            type_=token_utils.TokenType.EMAIL_CHANGE_CONFIRMATION,
            ttl=users_constants.EMAIL_CHANGE_TOKEN_LIFE_TIME,
            user_id=user.id,
        )

        response = client.with_token(user.email).get("/native/v2/profile/email_update/status")

        assert response.status_code == 200, response.json
        assert response.json == {
            "newEmail": None,
            "expired": False,
            "status": users_models.EmailHistoryEventTypeEnum.UPDATE_REQUEST.value,
            "token": None,
        }
        token.expire()

    def test_status_returns_new_email_selection_token(self, client):
        yesterday = datetime.utcnow() + timedelta(days=-1)
        user = users_factories.BeneficiaryGrant18Factory()
        users_factories.EmailUpdateEntryFactory(
            user=user, creationDate=yesterday, newUserEmail=None, newDomainEmail=None
        )
        users_factories.EmailConfirmationEntryFactory(user=user, newUserEmail=None, newDomainEmail=None)
        token = token_utils.Token.create(
            type_=token_utils.TokenType.EMAIL_CHANGE_NEW_EMAIL_SELECTION,
            ttl=users_constants.EMAIL_CHANGE_TOKEN_LIFE_TIME,
            user_id=user.id,
        )

        response = client.with_token(user.email).get("/native/v2/profile/email_update/status")

        assert response.status_code == 200, response.json
        assert response.json == {
            "newEmail": None,
            "expired": False,
            "status": users_models.EmailHistoryEventTypeEnum.CONFIRMATION.value,
            "token": token.encoded_token,
        }
        token.expire()

    def test_new_email_selection_status(self, client):
        yesterday = datetime.utcnow() + timedelta(days=-1)
        two_days_ago = yesterday + timedelta(days=-1)
        user = users_factories.BeneficiaryGrant18Factory()
        users_factories.EmailUpdateEntryFactory(
            user=user, creationDate=two_days_ago, newUserEmail=None, newDomainEmail=None
        )
        users_factories.EmailConfirmationEntryFactory(
            user=user, creationDate=yesterday, newUserEmail=None, newDomainEmail=None
        )
        users_factories.NewEmailSelectionEntryFactory(user=user, newUserEmail="alice", newDomainEmail="example.com")
        token = token_utils.Token.create(
            type_=token_utils.TokenType.EMAIL_CHANGE_VALIDATION,
            ttl=users_constants.EMAIL_CHANGE_TOKEN_LIFE_TIME,
            user_id=user.id,
            data={"new_email": "alice@example.com"},
        )

        response = client.with_token(user.email).get("/native/v2/profile/email_update/status")

        assert response.status_code == 200, response.json
        assert response.json == {
            "newEmail": "alice@example.com",
            "expired": False,
            "status": users_models.EmailHistoryEventTypeEnum.NEW_EMAIL_SELECTION.value,
            "token": None,
        }
        token.expire()

    def test_status_without_prior_history(self, client):
        user = users_factories.BeneficiaryGrant18Factory()

        response = client.with_token(user.email).get("/native/v2/profile/email_update/status")

        assert response.status_code == 404, response.json

    def test_status_unauthenticated(self, client):
        response = client.get("/native/v2/profile/email_update/status")

        assert response.status_code == 401, response.json


class UpdateUserEmailIntegrationTest:
    def test_user_email_update_flow(self, client):
        user = users_factories.BeneficiaryGrant18Factory()

        email_update_start_response = client.with_token(user.email).post("/native/v2/profile/update_email")
        assert email_update_start_response == 204, email_update_start_response.json

        [email_update_confirmation_token] = _get_last_sent_email_url_params()["token"]
        email_update_confirmation_response = client.post(
            "/native/v2/profile/email_update/confirm", json={"token": email_update_confirmation_token}
        )
        assert email_update_confirmation_response == 200, email_update_confirmation_response.json

        new_email = "alice@example.com"
        new_email_selection_token = email_update_confirmation_response.json["newEmailSelectionToken"]
        new_email_selection_response = client.with_token(user.email).post(
            "/native/v2/profile/email_update/new_email",
            json={"token": new_email_selection_token, "newEmail": new_email},
        )
        assert new_email_selection_response == 204, new_email_selection_response

        [email_update_confirmation_token] = _get_last_sent_email_url_params()["token"]
        email_update_confirmation_response = client.with_token(user.email).put(
            "/native/v1/profile/email_update/validate",
            json={"token": email_update_confirmation_token},
        )
        assert email_update_confirmation_response == 200, email_update_confirmation_response

        assert user.email == new_email


def _get_last_sent_email_url_params():
    # extract new email from activation link, which is a firebase
    # dynamic link meaning that the real url needs to be extracted
    # from it.
    activation_email = mails_testing.outbox[-1]
    confirmation_link = urlparse(activation_email["params"]["CONFIRMATION_LINK"])
    base_url = parse_qs(confirmation_link.query)["link"][0]
    base_url_params = parse_qs(urlparse(base_url).query)
    return base_url_params
