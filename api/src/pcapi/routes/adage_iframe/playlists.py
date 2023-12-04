import logging
import typing

from pcapi.connectors.big_query.queries import ClassroomPlaylistQuery
import pcapi.connectors.big_query.queries.base as queries_base
from pcapi.core.educational import exceptions as educational_exceptions
from pcapi.core.educational import models as educational_models
from pcapi.core.educational import repository
import pcapi.core.educational.api.favorites as favorites_api
from pcapi.core.offerers.repository import get_venue_by_id
from pcapi.models.api_errors import ApiErrors
from pcapi.routes.adage_iframe import blueprint
from pcapi.routes.adage_iframe.security import adage_jwt_required
from pcapi.routes.adage_iframe.serialization import offers as serializers
from pcapi.routes.adage_iframe.serialization.adage_authentication import (
    get_redactor_information_from_adage_authentication,
)
from pcapi.routes.adage_iframe.serialization.adage_authentication import AuthenticatedInformation
from pcapi.serialization.decorator import spectree_serialize


logger = logging.getLogger(__name__)


@blueprint.adage_iframe.route("/playlists/classroom", methods=["GET"])
@spectree_serialize(response_model=serializers.ListCollectiveOffersResponseModel, api=blueprint.api)
@adage_jwt_required
def get_classroom_playlist(
    authenticated_information: AuthenticatedInformation,
) -> serializers.ListCollectiveOffersResponseModel:
    if not authenticated_information.uai:
        raise ApiErrors({"message": "institutionId is mandatory"}, status_code=403)

    institution = repository.get_educational_institution_public(institution_id=None, uai=authenticated_information.uai)
    if not institution:
        raise ApiErrors({"message": "institutionId is mandatory"}, status_code=403)

    try:
        informations = get_redactor_information_from_adage_authentication(authenticated_information)
    except educational_exceptions.MissingRequiredRedactorInformation:
        raise ApiErrors(errors={"auth": "unknown redactor"}, status_code=403)

    redactor = repository.find_redactor_by_email(informations.email)
    if not redactor:
        raise ApiErrors(errors={"auth": "unknown redactor"}, status_code=403)

    try:
        rows = {
            row.offer_id: row.distance_in_km for row in ClassroomPlaylistQuery().execute(institution_id=institution.id)
        }
    except queries_base.MalformedRow:
        return serializers.ListCollectiveOffersResponseModel(collectiveOffers=[])

    offer_ids = typing.cast(set[int], set(rows))

    offers = repository.get_collective_offers_by_ids_for_adage(offer_ids)
    favorite_ids = favorites_api.get_redactors_favorites_subset(redactor, offer_ids)

    return serializers.ListCollectiveOffersResponseModel(
        collectiveOffers=[
            serialize_collective_offer(offer=offer, is_favorite=offer.id in favorite_ids, distance=rows[offer.id])
            for offer in offers
        ]
    )


def serialize_collective_offer(
    offer: educational_models.CollectiveOffer, is_favorite: bool, distance: int
) -> serializers.CollectiveOfferResponseModel:
    offer_venue_id = offer.offerVenue.get("venueId")
    if offer_venue_id:
        offer_venue = get_venue_by_id(offer_venue_id)
    else:
        offer_venue = None

    serialized_offer = serializers.CollectiveOfferResponseModel.build(
        offer=offer, offerVenue=offer_venue, is_favorite=is_favorite
    )
    serialized_offer.venue.distance = distance

    return serialized_offer