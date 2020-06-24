import pytest
from datetime import datetime

from domain.beneficiary.beneficiary_pre_subscription_validator import check_email_is_not_taken, check_not_a_dupplicate, CantRegisterBeneficiary
from repository import repository
from tests.conftest import clean_database
from tests.model_creators.generic_creators import create_user
from tests.domain_creators.generic_creators import create_domain_beneficiary_pre_subcription

class CheckEmailIsNotTakenTest:
    @clean_database
    def test_raises_if_email_already_taken(self, app):
        # Given
        email = "email@example.org"
        existing_user = create_user(email=email)
        repository.save(existing_user)

        beneficiary_pre_subcription = create_domain_beneficiary_pre_subcription(email=email)

        # When
        with pytest.raises(CantRegisterBeneficiary) as error:
            check_email_is_not_taken(beneficiary_pre_subcription)

        # Then
        assert str(error.value) == f"Email {email} is already taken"

    @clean_database
    def test_doesnt_raise_if_email_not_taken(self, app):
        # Given
        existing_user = create_user(email="email@example.org")
        repository.save(existing_user)

        beneficiary_pre_subcription = create_domain_beneficiary_pre_subcription(email="different.email@example.org")

        # When
        check_output = check_email_is_not_taken(beneficiary_pre_subcription)

        # Then
        assert check_output == None

class CheckNotADupplicateTest:
    @clean_database
    def test_raises_if_dupplicate(self, app):
        # Given
        first_name = "John"
        last_name = "Doe"
        date_of_birth = datetime(1993, 2, 2)
        existing_user = create_user(first_name=first_name, last_name=last_name, date_of_birth=date_of_birth)
        repository.save(existing_user)

        beneficiary_pre_subcription = create_domain_beneficiary_pre_subcription(first_name=first_name, last_name=last_name, date_of_birth=date_of_birth)

        # When
        with pytest.raises(CantRegisterBeneficiary) as error:
            check_not_a_dupplicate(beneficiary_pre_subcription)

        # Then
        assert str(error.value) == f"User with id {existing_user.id} is a dupplicate"

    @clean_database
    def test_doesnt_raise_if_no_exact_dupplicate(self, app):
        # Given
        first_name = "John"
        last_name = "Doe"
        date_of_birth = datetime(1993, 2, 2)
        existing_user1 = create_user(first_name="Joe",
                                     last_name=last_name,
                                     date_of_birth=date_of_birth,
                                     email="e1@ex.org")
        existing_user2 = create_user(first_name=first_name,
                                     last_name="Trump",
                                     date_of_birth=date_of_birth,
                                     email="e2@ex.org")
        existing_user3 = create_user(first_name=first_name,
                                     last_name=last_name,
                                     date_of_birth=datetime(1992, 2, 2),
                                     email="e3@ex.org")
        repository.save(existing_user1, existing_user2, existing_user3)

        beneficiary_pre_subcription = create_domain_beneficiary_pre_subcription(first_name=first_name, last_name=last_name, date_of_birth=date_of_birth)

        # When
        check_output = check_not_a_dupplicate(beneficiary_pre_subcription)

        # Then
        assert check_output == None
