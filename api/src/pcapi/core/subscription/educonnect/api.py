import datetime
import logging

from pcapi.connectors.beneficiaries.educonnect import models as educonnect_models
from pcapi.core.fraud import api as fraud_api
from pcapi.core.fraud import models as fraud_models
from pcapi.core.mails.transactional.users import duplicate_beneficiary
from pcapi.core.subscription import api as subscription_api
from pcapi.core.subscription import messages as subscription_messages
from pcapi.core.subscription import models as subscription_models
from pcapi.core.users import models as users_models

from . import exceptions


logger = logging.getLogger(__name__)


def handle_educonnect_authentication(
    user: users_models.User, educonnect_user: educonnect_models.EduconnectUser
) -> list[fraud_models.FraudReasonCode]:
    educonnect_content = fraud_models.EduconnectContent(
        birth_date=educonnect_user.birth_date,
        educonnect_id=educonnect_user.educonnect_id,
        first_name=educonnect_user.first_name,
        ine_hash=educonnect_user.ine_hash,
        last_name=educonnect_user.last_name,
        registration_datetime=datetime.datetime.utcnow(),
        school_uai=educonnect_user.school_uai,
        student_level=educonnect_user.student_level,
    )

    try:
        fraud_check = fraud_api.on_educonnect_result(user, educonnect_content)
    except Exception:
        logger.exception("Error on educonnect result", extra={"user_id": user.id})
        raise exceptions.EduconnectSubscriptionException()

    if fraud_check.status == fraud_models.FraudCheckStatus.OK:
        try:
            subscription_api.on_successful_application(user=user, source_data=fraud_check.source_data())  # type: ignore [arg-type]
        except Exception:
            logger.exception("Error while activating user from Educonnect", extra={"user_id": user.id})
            raise exceptions.EduconnectSubscriptionException()
    else:
        _handle_validation_errors(user, fraud_check, educonnect_user)
        subscription_api.update_user_birth_date(user, fraud_check.source_data().get_birth_date())  # type: ignore [union-attr]
        logger.warning(
            "Fraud suspicion after educonnect authentication with codes: %s",
            (", ").join([code.value for code in fraud_check.reasonCodes]),  # type: ignore [union-attr]
            extra={"user_id": user.id},
        )

    return fraud_check.reasonCodes  # type: ignore [return-value]


def _handle_validation_errors(
    user: users_models.User,
    fraud_check: fraud_models.BeneficiaryFraudCheck,
    educonnect_user: educonnect_models.EduconnectUser,
) -> None:
    if fraud_models.FraudReasonCode.ALREADY_BENEFICIARY in fraud_check.reasonCodes:  # type: ignore [operator]
        subscription_messages.on_already_beneficiary(user)

    if fraud_models.FraudReasonCode.AGE_NOT_VALID in fraud_check.reasonCodes:  # type: ignore [operator]
        subscription_messages.on_educonnect_age_not_valid(user, educonnect_user)

    elif fraud_models.FraudReasonCode.NOT_ELIGIBLE in fraud_check.reasonCodes:  # type: ignore [operator]
        subscription_messages.on_educonnect_not_eligible(user, educonnect_user)

    if fraud_models.FraudReasonCode.DUPLICATE_USER in fraud_check.reasonCodes:  # type: ignore [operator]
        subscription_messages.on_educonnect_duplicate_user(user)
        duplicate_beneficiary.send_duplicate_beneficiary_email(user, fraud_check.source_data())  # type: ignore [arg-type]

    if fraud_models.FraudReasonCode.DUPLICATE_INE in fraud_check.reasonCodes:  # type: ignore [operator]
        subscription_messages.on_educonnect_duplicate_ine(user)


def get_educonnect_subscription_item_status(
    user: users_models.User,
    eligibility: users_models.EligibilityType | None,
    educonnect_fraud_checks: list[fraud_models.BeneficiaryFraudCheck],
) -> subscription_models.SubscriptionItemStatus:
    """
    An educonnect failure is always retryable, as long as the user is eligible for UNDERAGE grant
    """
    if any(check.status == fraud_models.FraudCheckStatus.OK for check in educonnect_fraud_checks):
        return subscription_models.SubscriptionItemStatus.OK

    if (
        subscription_api.is_eligibility_activable(user, eligibility)
        and user.eligibility == users_models.EligibilityType.UNDERAGE
    ):
        return subscription_models.SubscriptionItemStatus.TODO

    return subscription_models.SubscriptionItemStatus.VOID
