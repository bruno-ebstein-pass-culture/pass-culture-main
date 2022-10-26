import datetime
import logging
import typing

import click
import sqlalchemy.orm as sqla_orm

from pcapi import settings
import pcapi.connectors.big_query.queries as big_query_queries
import pcapi.core.bookings.api as bookings_api
from pcapi.core.bookings.external import booking_notifications
from pcapi.core.bookings.external.booking_notifications import notify_users_bookings_not_retrieved
from pcapi.core.bookings.external.booking_notifications import send_today_events_notifications_metropolitan_france
import pcapi.core.bookings.repository as bookings_repository
import pcapi.core.fraud.api as fraud_api
import pcapi.core.mails.transactional as transactional_mails
from pcapi.core.offerers.repository import (
    find_venues_of_offerers_with_no_offer_and_at_least_one_physical_venue_and_validated_x_days_ago,
)
from pcapi.core.offerers.repository import find_offerers_validated_3_days_ago_with_no_venues
from pcapi.core.offers.models import Offer
from pcapi.core.offers.models import Stock
from pcapi.core.offers.repository import check_stock_consistency
from pcapi.core.offers.repository import delete_past_draft_collective_offers
from pcapi.core.offers.repository import delete_past_draft_offers
from pcapi.core.offers.repository import find_event_stocks_happening_in_x_days
import pcapi.core.providers.repository as providers_repository
from pcapi.core.providers.repository import get_provider_by_local_class
from pcapi.core.users import api as users_api
import pcapi.core.users.constants as users_constants
from pcapi.core.users.external import user_automations
from pcapi.core.users.repository import get_newly_eligible_age_18_users
from pcapi.local_providers.provider_manager import synchronize_venue_providers
from pcapi.models import db
from pcapi.models.feature import FeatureToggle
from pcapi.notifications import push
from pcapi.notifications.push import transactional_notifications
from pcapi.scheduled_tasks.decorators import cron_require_feature
from pcapi.scheduled_tasks.decorators import log_cron_with_transaction
from pcapi.scripts.booking import handle_expired_bookings as handle_expired_bookings_module
from pcapi.scripts.booking import notify_soon_to_be_expired_bookings
from pcapi.scripts.payment import user_recredit
from pcapi.scripts.subscription import dms as dms_script
from pcapi.scripts.subscription import ubble as ubble_script
from pcapi.utils.blueprint import Blueprint


DMS_OLD_PROCEDURE_ID = 44623


blueprint = Blueprint(__name__, __name__)
logger = logging.getLogger(__name__)


@blueprint.cli.command("update_booking_used")
@log_cron_with_transaction
@cron_require_feature(FeatureToggle.UPDATE_BOOKING_USED)
def update_booking_used() -> None:
    """Automatically mark as used bookings that correspond to events that
    have happened (with a delay).
    """
    bookings_api.auto_mark_as_used_after_event()


@blueprint.cli.command("synchronize_allocine_stocks")
@log_cron_with_transaction
@cron_require_feature(FeatureToggle.SYNCHRONIZE_ALLOCINE)
def synchronize_allocine_stocks() -> None:
    """Launch AlloCine synchronization."""
    allocine_stocks_provider_id = get_provider_by_local_class("AllocineStocks").id
    venue_providers = providers_repository.get_active_venue_providers_by_provider(allocine_stocks_provider_id)
    synchronize_venue_providers(venue_providers)


@blueprint.cli.command("synchronize_cine_office_stocks")
@log_cron_with_transaction
@cron_require_feature(FeatureToggle.ENABLE_CDS_IMPLEMENTATION)
def synchronize_cine_office_stocks() -> None:
    """Launch Cine Office synchronization."""
    cine_office_stocks_provider_id = get_provider_by_local_class("CDSStocks").id
    venue_providers = providers_repository.get_active_venue_providers_by_provider(cine_office_stocks_provider_id)
    synchronize_venue_providers(venue_providers)


@blueprint.cli.command("import_beneficiaries_from_dms_v4")
@log_cron_with_transaction
def import_beneficiaries_from_dms_legacy() -> None:
    procedures = []
    if settings.IS_PROD:
        procedures.append(("old_procedure_1", settings.DMS_NEW_ENROLLMENT_PROCEDURE_ID))
        procedures.append(("old_procedure_2", DMS_OLD_PROCEDURE_ID))
        procedures.append(
            ("old_procedure_after_general_opening", settings.DMS_ENROLLMENT_PROCEDURE_ID_AFTER_GENERAL_OPENING)
        )

    for procedure_name, procedure_id in procedures:
        if not procedure_id:
            logger.info("Skipping DMS %s because procedure id is empty", procedure_name)
            continue
        dms_script.import_dms_accepted_applications(procedure_id)


@blueprint.cli.command("archive_already_processed_dms_applications")
@log_cron_with_transaction
def archive_already_processed_dms_applications() -> None:
    procedures = [
        ("v4_FR", settings.DMS_ENROLLMENT_PROCEDURE_ID_v4_FR),
        ("v4_ET", settings.DMS_ENROLLMENT_PROCEDURE_ID_v4_ET),
    ]
    if settings.IS_PROD:
        procedures.append(("old_procedure_1", settings.DMS_NEW_ENROLLMENT_PROCEDURE_ID))
        procedures.append(("old_procedure_2", DMS_OLD_PROCEDURE_ID))
        procedures.append(
            ("old_procedure_after_general_opening", settings.DMS_ENROLLMENT_PROCEDURE_ID_AFTER_GENERAL_OPENING)
        )

    for procedure_name, procedure_id in procedures:
        if not procedure_id:
            logger.info("Skipping DMS %s because procedure id is empty", procedure_name)
            continue
        dms_script.archive_dms_applications.archive_applications(procedure_id, dry_run=False)


@blueprint.cli.command("import_all_updated_dms_applications")
@log_cron_with_transaction
def import_all_updated_dms_applications() -> None:
    for procedure_name, procedure_id in (
        ("v4_FR", settings.DMS_ENROLLMENT_PROCEDURE_ID_v4_FR),
        ("v4_ET", settings.DMS_ENROLLMENT_PROCEDURE_ID_v4_ET),
    ):
        if not procedure_id:
            logger.info("Skipping DMS %s because procedure id is empty", procedure_name)
            continue
        dms_script.import_all_updated_dms_applications(procedure_id)


@blueprint.cli.command("handle_expired_bookings")
@log_cron_with_transaction
def handle_expired_bookings() -> None:
    handle_expired_bookings_module.handle_expired_bookings()


@blueprint.cli.command("notify_soon_to_be_expired_individual_bookings")
@log_cron_with_transaction
def notify_soon_to_be_expired_individual_bookings() -> None:
    notify_soon_to_be_expired_bookings.notify_soon_to_be_expired_individual_bookings()


@blueprint.cli.command("notify_newly_eligible_age_18_users")
@log_cron_with_transaction
def notify_newly_eligible_age_18_users() -> None:
    if not settings.IS_PROD and not settings.IS_TESTING:
        return
    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    for user in get_newly_eligible_age_18_users(yesterday):
        transactional_mails.send_birthday_age_18_email_to_newly_eligible_user(user)


@blueprint.cli.command("clean_expired_tokens")
@log_cron_with_transaction
def clean_expired_tokens() -> None:
    users_api.delete_expired_tokens()
    db.session.commit()


@blueprint.cli.command("check_stock_quantity_consistency")
@log_cron_with_transaction
def check_stock_quantity_consistency() -> None:
    inconsistent_stocks = check_stock_consistency()
    if inconsistent_stocks:
        logger.error("Found inconsistent stocks: %s", ", ".join([str(stock_id) for stock_id in inconsistent_stocks]))


@blueprint.cli.command("send_today_events_notifications_metropolitan_france")
@log_cron_with_transaction
def send_today_events_notifications_metropolitan_france_command() -> None:
    """
    Find bookings that occur today in metropolitan France and send
    notification to all the user to remind them of the event to remind
    the users of the incoming event
    """
    send_today_events_notifications_metropolitan_france()


@blueprint.cli.command("send_today_events_notifications_overseas_france")
@log_cron_with_transaction
@click.option("--utc-mean-offset", help="UTC offset to use (can be negative)", type=int, required=True)
@click.argument("departments", nargs=-1)
def send_today_events_notifications_overseas_france(utc_mean_offset: int, departments: typing.Iterable[str]) -> None:
    """
    Find bookings (grouped by stocks) that occur today in overseas
    France departments and send notifications to remind the users
    of the incoming event
    """
    booking_notifications.send_today_events_notifications_overseas(
        utc_mean_offset=utc_mean_offset, departments=departments
    )


@blueprint.cli.command("send_email_reminder_7_days_before_event")
@log_cron_with_transaction
def send_email_reminder_7_days_before_event() -> None:
    """Triggers email to be sent for events happening in 7 days"""
    stocks = find_event_stocks_happening_in_x_days(7).options(sqla_orm.joinedload(Stock.offer).joinedload(Offer.venue))
    for stock in stocks:
        transactional_mails.send_reminder_7_days_before_event_to_pro(stock)


def send_email_reminder_tomorrow_event_to_beneficiaries() -> None:
    """Triggers email reminder to beneficiaries for none digitals events happening tomorrow"""
    individual_bookings = bookings_repository.find_individual_bookings_event_happening_tomorrow_query()
    for individual_booking in individual_bookings:
        try:
            transactional_mails.send_individual_booking_event_reminder_email_to_beneficiary(individual_booking)
        except Exception:  # pylint: disable=broad-except
            logger.exception(
                "Could not send email reminder tomorrow event to beneficiary",
                extra={
                    "individualBookingId": individual_booking.id,
                    "userId": individual_booking.userId,
                },
            )


@blueprint.cli.command("send_email_reminder_offer_creation_j5")
@log_cron_with_transaction
def send_email_reminder_offer_creation_j5_to_pro() -> None:
    """Triggers email reminder to pro 5 days after venue creation if no offer is created"""
    venues = find_venues_of_offerers_with_no_offer_and_at_least_one_physical_venue_and_validated_x_days_ago(5)
    for venue_id, venue_booking_email in venues:
        try:
            transactional_mails.send_reminder_offer_creation_j5_to_pro(venue_booking_email)
        except Exception:  # pylint: disable=broad-except
            logger.exception(
                "Could not send email reminder offer creation j+5 to pro",
                extra={
                    "venue.id": venue_id,
                },
            )


@blueprint.cli.command("send_email_reminder_offer_creation_j10")
@log_cron_with_transaction
def send_email_reminder_offer_creation_j10_to_pro() -> None:
    """Triggers email reminder to pro 10 days after venue creation if no offer is created"""
    venues = find_venues_of_offerers_with_no_offer_and_at_least_one_physical_venue_and_validated_x_days_ago(10)
    for venue_id, venue_booking_email in venues:
        try:
            transactional_mails.send_reminder_offer_creation_j10_to_pro(venue_booking_email)
        except Exception:  # pylint: disable=broad-except
            logger.exception(
                "Could not send email reminder offer creation j+10 to pro",
                extra={
                    "venue.id": venue_id,
                },
            )


@blueprint.cli.command("send_email_reminder_venue_creation")
@log_cron_with_transaction
def send_email_reminder_venue_creation_to_pro() -> None:
    """Triggers email reminder to pro 3 days after offerer validation if a venue is not created"""
    offerers = find_offerers_validated_3_days_ago_with_no_venues()
    for offerer in offerers:
        try:
            transactional_mails.send_reminder_venue_creation_to_pro(offerer)
        except Exception:  # pylint: disable=broad-except
            logger.exception(
                "Could not send email reminder venue creation to pro",
                extra={
                    "offererId": offerer.id,
                },
            )


@blueprint.cli.command("send_email_reminder_tomorrow_event_to_beneficiaries")
@log_cron_with_transaction
def _send_email_reminder_tomorrow_event_to_beneficiaries() -> None:
    send_email_reminder_tomorrow_event_to_beneficiaries()


@blueprint.cli.command("clean_past_draft_offers")
@log_cron_with_transaction
def clean_past_draft_offers() -> None:
    """Deletes past offers and past collective offers that are in draft status"""
    if not FeatureToggle.OFFER_DRAFT_ENABLED.is_active():
        delete_past_draft_offers()
    delete_past_draft_collective_offers()


@blueprint.cli.command("recredit_underage_users")
@log_cron_with_transaction
def recredit_underage_users() -> None:
    user_recredit.recredit_underage_users()


@blueprint.cli.command("users_turned_eighteen_automation")
@log_cron_with_transaction
def users_turned_eighteen_automation() -> None:
    """Includes all young users who will turn 18 exactly 30 days later in "jeunes-18-m-1" list.
    This command is meant to be called every day."""
    user_automations.users_turned_eighteen_automation()


@blueprint.cli.command("users_beneficiary_credit_expiration_within_next_3_months_automation")
@log_cron_with_transaction
def users_beneficiary_credit_expiration_within_next_3_months_automation() -> None:
    """Includes all young user whose pass expires in the next 3 months in "jeunes-expiration-M-3" list.
    This command is meant to be called every day."""
    user_automations.users_beneficiary_credit_expiration_within_next_3_months_automation()


@blueprint.cli.command("users_ex_beneficiary_automation")
@log_cron_with_transaction
def users_ex_beneficiary_automation() -> None:
    """Includes all young users whose credit is expired in "jeunes-ex-benefs" list.
    This command is meant to be called every day."""
    user_automations.users_ex_beneficiary_automation()


@blueprint.cli.command("users_inactive_since_30_days_automation")
@log_cron_with_transaction
def users_inactive_since_30_days_automation() -> None:
    """Updates the list of users who are inactive since 30 days or more ("jeunes-utilisateurs-inactifs" list).
    This command is meant to be called every day."""
    user_automations.users_inactive_since_30_days_automation()


@blueprint.cli.command("users_one_year_with_pass_automation")
@log_cron_with_transaction
def users_one_year_with_pass_automation() -> None:
    """Includes young users who created their PassCulture account in the same month
    (from first to last day) one year earlier in "jeunes-un-an-sur-le-pass" list.
            This command is meant to be called every month."""
    user_automations.users_one_year_with_pass_automation()


@blueprint.cli.command("users_whose_credit_expired_today_automation")
@log_cron_with_transaction
def users_whose_credit_expired_today_automation() -> None:
    """Updates external attributes for young users whose credit just expired.
    This command is meant to be called every day."""
    user_automations.users_whose_credit_expired_today_automation()


@blueprint.cli.command("pro_inactive_venues_automation")
@log_cron_with_transaction
def pro_inactive_venues_automation() -> None:
    """Updates the list of venues which are inactive since 90 days or more ("pros-inactivité-90j" list).
    This command is meant to be called every day."""
    user_automations.pro_inactive_venues_automation()


@blueprint.cli.command("notify_users_bookings_not_retrieved")
@log_cron_with_transaction
def notify_users_bookings_not_retrieved_command() -> None:
    """
    Find soon expiring bookings that will expire in exactly N days and
    send a notification to each user.
    """
    notify_users_bookings_not_retrieved()


@blueprint.cli.command("delete_suspended_accounts_after_withdrawal_period")
@log_cron_with_transaction
def delete_suspended_accounts_after_withdrawal_period() -> None:
    query = fraud_api.get_suspended_upon_user_request_accounts_since(settings.DELETE_SUSPENDED_ACCOUNTS_SINCE)
    for user in query:
        users_api.suspend_account(user, users_constants.SuspensionReason.DELETED, None)


@blueprint.cli.command("handle_inactive_dms_applications_cron")
@log_cron_with_transaction
def handle_inactive_dms_applications_cron() -> None:
    # DMS_ENROLLMENT_PROCEDURE_ID_v4_ET is excluded because the review delay is longer
    # TESTING
    dms_script.handle_inactive_dms_applications(
        settings.DMS_ENROLLMENT_PROCEDURE_ID_v4_FR, with_never_eligible_applicant_rule=settings.IS_TESTING
    )

    if settings.IS_PROD:
        dms_script.handle_inactive_dms_applications(settings.DMS_ENROLLMENT_PROCEDURE_ID_AFTER_GENERAL_OPENING)
        dms_script.handle_inactive_dms_applications(
            settings.DMS_NEW_ENROLLMENT_PROCEDURE_ID, with_never_eligible_applicant_rule=True
        )
        dms_script.handle_inactive_dms_applications(DMS_OLD_PROCEDURE_ID)


@blueprint.cli.command("handle_deleted_dms_applications_cron")
@log_cron_with_transaction
def handle_deleted_dms_applications_cron() -> None:
    procedures = [
        settings.DMS_ENROLLMENT_PROCEDURE_ID_v4_FR,
        settings.DMS_ENROLLMENT_PROCEDURE_ID_v4_ET,
        settings.DMS_ENROLLMENT_PROCEDURE_ID_AFTER_GENERAL_OPENING,
        settings.DMS_NEW_ENROLLMENT_PROCEDURE_ID,
    ]
    if settings.IS_PROD:
        procedures.append(DMS_OLD_PROCEDURE_ID)
    for procedure_id in procedures:
        try:
            dms_script.handle_deleted_dms_applications(procedure_id)
        except Exception:  # pylint: disable=broad-except
            logger.exception("Failed to handle deleted DMS applications for procedure %s", procedure_id)


@blueprint.cli.command("update_pending_ubble_applications_cron")
@log_cron_with_transaction
def update_pending_ubble_applications_cron() -> None:
    ubble_script.update_pending_ubble_applications(dry_run=False)


@blueprint.cli.command("send_notification_favorites_not_booked")
@log_cron_with_transaction
def send_notification_favorites_not_booked() -> None:
    _send_notification_favorites_not_booked()  # avoid interference from click


def _send_notification_favorites_not_booked() -> None:
    """
    Find favorites without a booking and send one notification at most
    per user in order to encourage him to book it.

    To narrow the number of calls to the Batch api, group by offer.
    """
    max_length = settings.BATCH_MAX_USERS_PER_TRANSACTIONAL_NOTIFICATION
    rows = big_query_queries.FavoritesNotBooked().execute(max_length)

    for row in rows:
        try:
            notification_data = transactional_notifications.get_favorites_not_booked_notification_data(
                row.offer_id, row.offer_name, row.user_ids
            )

            if notification_data:
                push.send_transactional_notification(notification_data)
        except Exception:  # pylint: disable=broad-except
            log_extra = {"offer": row.offer_id, "users": row.user_ids, "count": len(row.user_ids)}
            logger.error("Favorites not booked: failed to send notification", extra=log_extra)
