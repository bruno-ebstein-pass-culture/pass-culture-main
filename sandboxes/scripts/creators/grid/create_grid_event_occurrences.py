from datetime import timedelta

from models.pc_object import PcObject
from sandboxes.scripts.utils.params import EVENT_OCCURRENCE_BEGINNING_DATETIMES
from utils.date import strftime
from utils.logger import logger
from utils.test_utils import create_event_occurrence

def create_grid_event_occurrences(event_offers_by_name):
    logger.info('create_grid_event_occurrences')

    event_occurrences_by_name = {}

    for event_offer in event_offers_by_name.values():
        for beginning_datetime in EVENT_OCCURRENCE_BEGINNING_DATETIMES:
            name = event_offer.eventOrThing.name + " " + event_offer.venue.name + " " + strftime(beginning_datetime)
            event_occurrences_by_name[name] = create_event_occurrence(
                beginning_datetime=strftime(beginning_datetime),
                end_datetime=strftime(beginning_datetime + timedelta(hours=1)),
                offer=event_offer
            )

    PcObject.check_and_save(*event_occurrences_by_name.values())

    return event_occurrences_by_name
