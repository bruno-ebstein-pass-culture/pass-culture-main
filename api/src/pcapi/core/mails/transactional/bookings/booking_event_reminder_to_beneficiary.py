from pcapi.core import mails
import pcapi.core.bookings.api as bookings_api
from pcapi.core.bookings.models import IndividualBooking
from pcapi.core.mails import models
from pcapi.core.mails.transactional.sendinblue_template_ids import TransactionalEmail
from pcapi.utils.date import format_time_in_second_to_human_readable
from pcapi.utils.date import get_date_formatted_for_email
from pcapi.utils.date import get_time_formatted_for_email
from pcapi.utils.date import utc_datetime_to_department_timezone
from pcapi.utils.urls import booking_app_link


def send_individual_booking_event_reminder_email_to_beneficiary(individual_booking: IndividualBooking) -> bool:
    data = get_booking_event_reminder_to_beneficiary_email_data(individual_booking)

    if data is None:
        return False

    return mails.send(recipients=[individual_booking.user.email], data=data)


def get_booking_event_reminder_to_beneficiary_email_data(
    individual_booking: IndividualBooking,
) -> models.TransactionalEmailData | None:
    if individual_booking.booking.stock.beginningDatetime is None:
        return None

    department_code = (
        individual_booking.booking.stock.offer.venue.departementCode
        if not individual_booking.booking.stock.offer.isDigital
        else individual_booking.user.departementCode
    )

    event_beginning_date_in_tz = utc_datetime_to_department_timezone(
        individual_booking.booking.stock.beginningDatetime, department_code
    )
    formatted_event_beginning_date = get_date_formatted_for_email(event_beginning_date_in_tz)
    formatted_event_beginning_time = get_time_formatted_for_email(event_beginning_date_in_tz)

    booking_token = (
        individual_booking.booking.activationCode.code
        if individual_booking.booking.activationCode
        else individual_booking.booking.token
    )

    offer_withdrawal_delay_in_days = (
        format_time_in_second_to_human_readable(individual_booking.booking.stock.offer.withdrawalDelay)
        if individual_booking.booking.stock.offer.withdrawalDelay
        else None
    )

    return models.TransactionalEmailData(
        template=TransactionalEmail.BOOKING_EVENT_REMINDER_TO_BENEFICIARY.value,
        params={
            "BOOKING_LINK": booking_app_link(individual_booking.booking),
            "EVENT_DATETIME_ISO": event_beginning_date_in_tz.isoformat(),
            "EVENT_DATE": formatted_event_beginning_date,
            "EVENT_HOUR": formatted_event_beginning_time,
            "IS_DUO_EVENT": individual_booking.booking.quantity == 2,
            "OFFER_NAME": individual_booking.booking.stock.offer.name,
            "OFFER_TAGS": ",".join([criterion.name for criterion in individual_booking.booking.stock.offer.criteria]),
            "OFFER_TOKEN": booking_token,
            "OFFER_WITHDRAWAL_DELAY": offer_withdrawal_delay_in_days,
            "OFFER_WITHDRAWAL_DETAILS": individual_booking.booking.stock.offer.withdrawalDetails or None,
            "OFFER_WITHDRAWAL_TYPE": individual_booking.booking.stock.offer.withdrawalType,
            "QR_CODE": bookings_api.get_qr_code_data(individual_booking.booking.token),
            "SUBCATEGORY": individual_booking.booking.stock.offer.subcategoryId,
            "USER_FIRST_NAME": individual_booking.user.firstName,
            "VENUE_ADDRESS": individual_booking.booking.stock.offer.venue.address,
            "VENUE_CITY": individual_booking.booking.stock.offer.venue.city,
            "VENUE_NAME": individual_booking.booking.stock.offer.venue.publicName
            if individual_booking.booking.stock.offer.venue.publicName
            else individual_booking.booking.stock.offer.venue.name,
            "VENUE_POSTAL_CODE": individual_booking.booking.stock.offer.venue.postalCode,
        },
    )

    print(
        """
<div itemscope itemtype="http://schema.org/EventReservation">
    <meta itemprop="url" content="{{ PARAMS.BOOKING_LINK }}"/>
    <div itemprop="underName" itemscope itemtype="http://schema.org/Person">
        <meta itemprop="name" content="{{ PARAMS.USER_FIRST_NAME }}"/>
    </div>
    <meta itemprop="reservationNumber" content="{{ PARAMS.OFFER_TOKEN }}"/> <!-- this is not a standard of schema.org but need by https://www.google.com/webmasters/markup-tester/ -->
    <div itemprop="reservedTicket" itemscope itemtype="https://schema.org/Ticket">
        <meta itemprop="ticketNumber" content="{{ PARAMS.OFFER_TOKEN }}"/>
        <meta itemprop="ticketToken" content="{{ PARAMS.QR_CODE }}"/>
    </div>
    <meta itemprop="reservationStatus" content="http://schema.org/ReservationConfirmed"/>
    <div itemprop="reservationFor" itemscope itemtype="http://schema.org/Event">
        <meta itemprop="name" content="{{ PARAMS.OFFER_NAME }}"/>
        <meta itemprop="startDate" content="{{ PARAMS.EVENT_DATETIME_ISO }}"/>
        <div itemprop="location" itemscope itemtype="http://schema.org/Place">
            <meta itemprop="name" content="{{ PARAMS.VENUE_NAME }}"/>
            <div itemprop="address" itemscope itemtype="http://schema.org/PostalAddress">
                <meta itemprop="streetAddress" content="{{ PARAMS.VENUE_ADDRESS }}"/>
                <meta itemprop="addressLocality" content="{{ PARAMS.VENUE_CITY }}"/>
                <meta itemprop="postalCode" content="{{ PARAMS.VENUE_POSTAL_CODE }}"/>
                <meta itemprop="addressRegion" content="France"/>
                <meta itemprop="addressCountry" content="France"/>
            </div>
        </div>
    </div>
</div>

{% autoescape off %}
{{ params.my_html }}
{% endautoescape %}
        """
    )

    return new_var
