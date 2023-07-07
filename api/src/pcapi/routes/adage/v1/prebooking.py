import logging

from pcapi.core.bookings import exceptions as bookings_exceptions
from pcapi.core.educational import exceptions
from pcapi.core.educational import repository as educational_repository
from pcapi.core.educational.api import booking as educational_api_booking
from pcapi.models.api_errors import ApiErrors
from pcapi.routes.adage.security import adage_api_key_required
from pcapi.routes.adage.v1.educational_institution import educational_institution_path
from pcapi.routes.adage.v1.serialization import constants
from pcapi.routes.adage.v1.serialization import prebooking as prebooking_serialization
from pcapi.serialization.decorator import spectree_serialize


logger = logging.getLogger(__name__)

from . import blueprint


@blueprint.adage_v1.route(educational_institution_path + "/prebookings", methods=["GET"])
@spectree_serialize(
    api=blueprint.api, response_model=prebooking_serialization.EducationalBookingsResponse, tags=("get prebookings",)
)
@adage_api_key_required
def get_educational_bookings(
    query: prebooking_serialization.GetEducationalBookingsRequest, year_id: str, uai_code: str
) -> prebooking_serialization.EducationalBookingsResponse:
    educational_bookings = educational_repository.find_collective_bookings_for_adage(
        uai_code=uai_code,
        year_id=year_id,
        redactor_email=query.redactorEmail,
    )

    return prebooking_serialization.EducationalBookingsResponse(
        prebookings=prebooking_serialization.serialize_collective_bookings(educational_bookings)
    )


@blueprint.adage_v1.route("/prebookings/<int:educational_booking_id>/confirm", methods=["POST"])
@spectree_serialize(
    api=blueprint.api,
    response_model=prebooking_serialization.EducationalBookingResponse,
    on_error_statuses=[404, 422],
    tags=("change prebookings",),
)
@adage_api_key_required
def confirm_prebooking(educational_booking_id: int) -> prebooking_serialization.EducationalBookingResponse:
    try:
        educational_booking = educational_api_booking.confirm_collective_booking(educational_booking_id)
    except exceptions.InsufficientFund:
        raise ApiErrors({"code": "INSUFFICIENT_FUND"}, status_code=422)
    except exceptions.InsufficientMinistryFund:
        raise ApiErrors({"code": "INSUFFICIENT_MINISTRY_FUND"}, status_code=422)
    except exceptions.InsufficientTemporaryFund:
        raise ApiErrors({"code": "INSUFFICIENT_FUND_DEPOSIT_NOT_FINAL"}, status_code=422)
    except exceptions.BookingIsCancelled:
        raise ApiErrors({"code": "EDUCATIONAL_BOOKING_IS_CANCELLED"}, status_code=422)
    except bookings_exceptions.ConfirmationLimitDateHasPassed:
        raise ApiErrors({"code": "CONFIRMATION_LIMIT_DATE_HAS_PASSED"}, status_code=422)
    except exceptions.EducationalBookingNotFound:
        raise ApiErrors({"code": constants.EDUCATIONAL_BOOKING_NOT_FOUND}, status_code=404)
    except exceptions.EducationalDepositNotFound:
        raise ApiErrors({"code": "DEPOSIT_NOT_FOUND"}, status_code=404)

    return prebooking_serialization.serialize_collective_booking(educational_booking)


@blueprint.adage_v1.route("/prebookings/<int:educational_booking_id>/refuse", methods=["POST"])
@spectree_serialize(
    api=blueprint.api,
    response_model=prebooking_serialization.EducationalBookingResponse,
    on_error_statuses=[404, 422],
    tags=("change prebookings", "change bookings"),
)
@adage_api_key_required
def refuse_pre_booking(educational_booking_id: int) -> prebooking_serialization.EducationalBookingResponse:
    """Refuse a prebooking confirmation

    Can only work if prebooking is confirmed or pending,
    is not yet used and still refusable."""
    try:
        educational_booking = educational_api_booking.refuse_collective_booking(educational_booking_id)
    except exceptions.EducationalBookingNotFound:
        raise ApiErrors({"code": constants.EDUCATIONAL_BOOKING_NOT_FOUND}, status_code=404)
    except exceptions.EducationalBookingNotRefusable:
        raise ApiErrors({"code": "EDUCATIONAL_BOOKING_NOT_REFUSABLE"}, status_code=422)
    except exceptions.CollectiveBookingAlreadyCancelled:
        raise ApiErrors({"code": "EDUCATIONAL_BOOKING_ALREADY_CANCELLED"}, status_code=422)
    return prebooking_serialization.serialize_collective_booking(educational_booking)


@blueprint.adage_v1.route("/years/<string:educational_year_id>/prebookings", methods=["GET"])
@spectree_serialize(
    api=blueprint.api,
    response_model=prebooking_serialization.EducationalBookingsPerYearResponse,
    tags=("get bookings per year",),
)
@adage_api_key_required
def get_all_bookings_per_year(
    educational_year_id: str,
    query: prebooking_serialization.GetAllBookingsPerYearQueryModel,
) -> prebooking_serialization.EducationalBookingsPerYearResponse:
    educational_bookings = educational_repository.get_paginated_collective_bookings_for_educational_year(
        educational_year_id,
        query.page,
        query.per_page,
    )
    return prebooking_serialization.get_collective_bookings_per_year_response(educational_bookings)


@blueprint.adage_v1.route("/prebookings/move", methods=["POST"])
@spectree_serialize(
    api=blueprint.api,
    on_success_status=204,
    on_error_statuses=[404, 422],
    tags=("merge institution"),
)
@adage_api_key_required
def merge_institution_prebookings(body: prebooking_serialization.MergeInstitutionPrebookingsQueryModel) -> None:
    institution_source = educational_repository.find_educational_institution_by_uai_code(body.source_uai)
    if not institution_source:
        raise ApiErrors({"code": "Source institution not found"}, status_code=404)
    institution_destination = educational_repository.find_educational_institution_by_uai_code(body.destination_uai)
    if not institution_destination:
        raise ApiErrors({"code": "destination institution not found"}, status_code=404)

    educational_api_booking.update_collective_bookings_for_new_institution(
        booking_ids=body.bookings_ids,
        institution_source=institution_source,
        institution_destination=institution_destination,
    )
    return
