from datetime import datetime
from datetime import timedelta
from decimal import Decimal

import pytest

from pcapi.domain.user_activation import is_import_status_change_allowed
from pcapi.models import ImportStatus
from pcapi.scripts.beneficiary.old_remote_import import create_beneficiary_from_application


class IsImportStatusChangeAllowedTest:
    @pytest.mark.parametrize(
        ["new_status", "allowed"],
        [
            (ImportStatus.REJECTED, True),
            (ImportStatus.RETRY, True),
            (ImportStatus.ERROR, False),
            (ImportStatus.CREATED, False),
        ],
    )
    def test_duplicate_can_be_rejected_or_retried(self, new_status, allowed):
        assert is_import_status_change_allowed(ImportStatus.DUPLICATE, new_status) is allowed

    @pytest.mark.parametrize(
        "new_status", [ImportStatus.DUPLICATE, ImportStatus.REJECTED, ImportStatus.CREATED, ImportStatus.RETRY]
    )
    def test_error_cannot_be_changed(self, new_status):
        assert is_import_status_change_allowed(ImportStatus.ERROR, new_status) is False

    @pytest.mark.parametrize(
        "new_status", [ImportStatus.DUPLICATE, ImportStatus.REJECTED, ImportStatus.ERROR, ImportStatus.RETRY]
    )
    def test_created_cannot_be_changed(self, new_status):
        assert is_import_status_change_allowed(ImportStatus.CREATED, new_status) is False

    @pytest.mark.parametrize(
        "new_status", [ImportStatus.DUPLICATE, ImportStatus.CREATED, ImportStatus.ERROR, ImportStatus.RETRY]
    )
    def test_rejected_cannot_be_changed(self, new_status):
        assert is_import_status_change_allowed(ImportStatus.REJECTED, new_status) is False

    @pytest.mark.parametrize(
        "new_status", [ImportStatus.DUPLICATE, ImportStatus.CREATED, ImportStatus.ERROR, ImportStatus.REJECTED]
    )
    def test_retry_cannot_be_changed(self, new_status):
        assert is_import_status_change_allowed(ImportStatus.RETRY, new_status) is False


class CreateBeneficiaryFromApplicationTest:
    def test_return_newly_created_user(self):
        # given
        THIRTY_DAYS_FROM_NOW = (datetime.utcnow() + timedelta(days=30)).date()
        beneficiary_information = {
            "department": "67",
            "last_name": "Doe",
            "first_name": "Jane",
            "activity": "Lycéen",
            "civility": "Mme",
            "birth_date": datetime(2000, 5, 1),
            "email": "jane.doe@test.com",
            "phone": "0612345678",
            "postal_code": "67200",
            "application_id": 123,
        }

        # when
        beneficiary = create_beneficiary_from_application(beneficiary_information)

        # then
        assert beneficiary.lastName == "Doe"
        assert beneficiary.firstName == "Jane"
        assert beneficiary.publicName == "Jane Doe"
        assert beneficiary.email == "jane.doe@test.com"
        assert beneficiary.phoneNumber == "0612345678"
        assert beneficiary.departementCode == "67"
        assert beneficiary.postalCode == "67200"
        assert beneficiary.dateOfBirth == datetime(2000, 5, 1)
        assert beneficiary.isBeneficiary == True
        assert beneficiary.isAdmin == False
        assert beneficiary.password is not None
        assert beneficiary.resetPasswordToken is not None
        assert beneficiary.resetPasswordTokenValidityLimit.date() == THIRTY_DAYS_FROM_NOW
        assert beneficiary.activity == "Lycéen"
        assert beneficiary.civility == "Mme"
        assert beneficiary.hasSeenTutorials == False

    def test_a_deposit_is_made_for_the_new_beneficiary(self):
        # given
        beneficiary_information = {
            "department": "67",
            "last_name": "Doe",
            "first_name": "Jane",
            "activity": "Lycéen",
            "civility": "Mme",
            "birth_date": datetime(2000, 5, 1),
            "email": "jane.doe@test.com",
            "phone": "0612345678",
            "postal_code": "67200",
            "application_id": 123,
        }
        # when
        beneficiary = create_beneficiary_from_application(beneficiary_information)

        # then
        assert len(beneficiary.deposits) == 1
        assert beneficiary.deposits[0].amount == Decimal(500)
        assert beneficiary.deposits[0].source == "démarches simplifiées dossier [123]"
