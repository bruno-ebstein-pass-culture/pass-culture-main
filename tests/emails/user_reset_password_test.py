from datetime import datetime
from unittest.mock import patch

import pytest

from pcapi.emails.user_reset_password import retrieve_data_for_reset_password_native_app_email
from pcapi.emails.user_reset_password import retrieve_data_for_reset_password_user_email
from pcapi.model_creators.generic_creators import create_offerer
from pcapi.model_creators.generic_creators import create_user
from pcapi.model_creators.generic_creators import create_user_offerer
from pcapi.repository import repository


class MakeUserResetPasswordEmailDataTest:
    @patch("pcapi.emails.user_reset_password.format_environment_for_email", return_value="-testing")
    @patch("pcapi.emails.user_reset_password.feature_send_mail_to_users_enabled", return_value=False)
    @pytest.mark.usefixtures("db_session")
    def test_email_is_sent_to_dev_at_passculture_when_not_production_environment(
        self, mock_send_mail_enabled, mock_format_env, app
    ):
        # Given
        user = create_user(email="ewing@example.com", first_name="Bobby", reset_password_token="ABCDEFG")
        offerer = create_offerer()
        user_offerer = create_user_offerer(user, offerer)

        repository.save(user_offerer)

        # When
        reset_password_email_data = retrieve_data_for_reset_password_user_email(user=user)

        # Then
        assert reset_password_email_data == {
            "FromEmail": "support@example.com",
            "MJ-TemplateID": 912168,
            "MJ-TemplateLanguage": True,
            "To": "dev@example.com",
            "Vars": {"prenom_user": "Bobby", "token": user.resetPasswordToken, "env": "-testing"},
        }

    @patch("pcapi.emails.user_reset_password.format_environment_for_email", return_value="")
    @patch("pcapi.emails.user_reset_password.feature_send_mail_to_users_enabled", return_value=True)
    @pytest.mark.usefixtures("db_session")
    def test_email_is_sent_to_pro_offerer_when_production_environment(
        self, mock_send_mail_enabled, mock_format_env, app
    ):
        # Given
        user = create_user(email="ewing@example.com", first_name="Bobby", reset_password_token="ABCDEFG")
        offerer = create_offerer()
        user_offerer = create_user_offerer(user, offerer)

        repository.save(user_offerer)

        # When
        reset_password_email_data = retrieve_data_for_reset_password_user_email(user=user)

        # Then
        assert reset_password_email_data == {
            "FromEmail": "support@example.com",
            "MJ-TemplateID": 912168,
            "MJ-TemplateLanguage": True,
            "To": "ewing@example.com",
            "Vars": {"prenom_user": "Bobby", "token": user.resetPasswordToken, "env": ""},
        }


class NativeAppUserResetPasswordEmailDataTest:
    def test_email_is_encoded_in_(self, app):
        # When
        reset_password_email_data = retrieve_data_for_reset_password_native_app_email(
            user_email="ewing+demo@example.com",
            token_value="abc",
            expiration_date=datetime(2020, 1, 1),
        )

        # Then
        assert reset_password_email_data == {
            "FromEmail": "support@example.com",
            "MJ-TemplateID": 1838526,
            "MJ-TemplateLanguage": True,
            "To": "dev@example.com",
            "Vars": {
                "native_app_link": (
                    "http://localhost/native/v1/redirect_to_native/mot-de-passe-perdu"
                    "?token=abc&expiration_timestamp=1577836800&email=ewing%2Bdemo%40example.com"
                )
            },
        }
