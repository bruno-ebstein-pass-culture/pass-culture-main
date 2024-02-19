from unittest.mock import patch
from urllib.parse import parse_qs
from urllib.parse import urlparse

import pytest

import pcapi.core.mails.testing as mails_testing
from pcapi.core.testing import override_settings
from pcapi.core.users import factories as users_factories
from pcapi.core.users import models as users_models
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

        # extract new email from activation link, which is a firebase
        # dynamic link meaning that the real url needs to be extracted
        # from it.
        activation_email = mails_testing.outbox[-1]
        confirmation_link = urlparse(activation_email["params"]["CONFIRMATION_LINK"])
        base_url = parse_qs(confirmation_link.query)["link"][0]
        base_url_params = parse_qs(urlparse(base_url).query)
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