import logging

from pcapi.core.categories import categories
from pcapi.core.educational import exceptions as educational_exceptions
from pcapi.core.educational import models as educational_models
from pcapi.core.educational import repository as educational_repository
from pcapi.core.offerers import repository as offerers_repository
from pcapi.models.api_errors import ApiErrors
from pcapi.routes.pro import blueprint
from pcapi.routes.serialization import public_api_collective_offers_serialize
from pcapi.serialization.decorator import spectree_serialize
from pcapi.serialization.spec_tree import ExtendResponse as SpectreeResponse
from pcapi.validation.routes.users_authentifications import api_key_required
from pcapi.validation.routes.users_authentifications import current_api_key


BASE_CODE_DESCRIPTIONS = {
    "HTTP_401": (None, "Authentification nécessaire"),
    "HTTP_403": (None, "Vous n'avez pas les droits nécessaires pour voir cette offre collective"),
    "HTTP_404": (None, "L'offre collective n'existe pas"),
}


logger = logging.getLogger(__name__)


@blueprint.pro_public_api_v2.route("/collective-offers/venues", methods=["GET"])
@api_key_required
@spectree_serialize(
    on_success_status=200,
    on_error_statuses=[401],
    response_model=public_api_collective_offers_serialize.CollectiveOffersListVenuesResponseModel,
    api=blueprint.pro_public_schema_v2,
)
def list_venues() -> public_api_collective_offers_serialize.CollectiveOffersListVenuesResponseModel:
    # in French, to be used by Swagger for the API documentation
    """Récupération de la liste des lieux associés à la structure authentifiée par le jeton d'API.

    Tous les lieux enregistrés, physiques ou virtuels, sont listés ici avec leurs coordonnées.
    """
    offerer_id = current_api_key.offererId  # type: ignore [attr-defined]
    venues = offerers_repository.get_all_venues_by_offerer_id(offerer_id)

    return public_api_collective_offers_serialize.CollectiveOffersListVenuesResponseModel(
        __root__=[
            public_api_collective_offers_serialize.CollectiveOffersVenueResponseModel.from_orm(venue)
            for venue in venues
        ]
    )


@blueprint.pro_public_api_v2.route("/collective-offers/<int:offer_id>", methods=["GET"])
@api_key_required
@spectree_serialize(
    api=blueprint.pro_public_schema_v2,
    resp=SpectreeResponse(
        **(
            BASE_CODE_DESCRIPTIONS
            | {
                "HTTP_200": (
                    public_api_collective_offers_serialize.GetPublicCollectiveOfferResponseModel,
                    "L'offre collective existe",
                ),
            }
        )
    ),
)
def get_collective_offer_public(
    offer_id: int,
) -> public_api_collective_offers_serialize.GetPublicCollectiveOfferResponseModel:
    # in French, to be used by Swagger for the API documentation
    """Récuperation de l'offre collective avec l'identifiant offer_id."""
    try:
        offer = educational_repository.get_collective_offer_by_id(offer_id)
    except educational_exceptions.CollectiveOfferNotFound:
        raise ApiErrors(
            errors={
                "global": ["L'offre collective n'existe pas"],
            },
            status_code=404,
        )

    if not offer.collectiveStock:
        # if the offer does not have any stock pretend it doesn't exists
        raise ApiErrors(
            errors={
                "global": ["L'offre collective n'existe pas"],
            },
            status_code=404,
        )
    if offer.venue.managingOffererId != current_api_key.offerer.id:  # type: ignore [attr-defined]
        raise ApiErrors(
            errors={
                "global": ["Vous n'avez pas les droits d'accès suffisant pour accéder à cette information."],
            },
            status_code=403,
        )
    return public_api_collective_offers_serialize.GetPublicCollectiveOfferResponseModel.from_orm(offer)


@blueprint.pro_public_api_v2.route("/collective-offers/categories", methods=["GET"])
@api_key_required
@spectree_serialize(
    on_success_status=200,
    on_error_statuses=[401],
    response_model=public_api_collective_offers_serialize.CollectiveOffersListCategoriesResponseModel,
    api=blueprint.pro_public_schema_v2,
)
def list_categories() -> public_api_collective_offers_serialize.CollectiveOffersListCategoriesResponseModel:
    # in French, to be used by Swagger for the API documentation
    """Récupération de la liste des catégories d'offres proposées."""
    return public_api_collective_offers_serialize.CollectiveOffersListCategoriesResponseModel(
        __root__=[
            public_api_collective_offers_serialize.CollectiveOffersCategoryResponseModel(
                id=category.id, name=category.pro_label
            )
            for category in categories.ALL_CATEGORIES
            if category.is_selectable
        ]
    )


@blueprint.pro_public_api_v2.route("/collective-offers/educational-domains", methods=["GET"])
@api_key_required
@spectree_serialize(
    on_success_status=200,
    on_error_statuses=[401],
    response_model=public_api_collective_offers_serialize.CollectiveOffersListDomainsResponseModel,
    api=blueprint.pro_public_schema_v2,
)
def list_educational_domains() -> public_api_collective_offers_serialize.CollectiveOffersListDomainsResponseModel:
    # in French, to be used by Swagger for the API documentation
    """Récupération de la liste des domaines d'éducation pouvant être associés aux offres collectives."""
    educational_domains = educational_repository.get_all_educational_domains_ordered_by_name()

    return public_api_collective_offers_serialize.CollectiveOffersListDomainsResponseModel(
        __root__=[
            public_api_collective_offers_serialize.CollectiveOffersDomainResponseModel.from_orm(educational_domain)
            for educational_domain in educational_domains
        ]
    )


@blueprint.pro_public_api_v2.route("/collective-offers/student-levels", methods=["GET"])
@api_key_required
@spectree_serialize(
    on_success_status=200,
    on_error_statuses=[401],
    response_model=public_api_collective_offers_serialize.CollectiveOffersListStudentLevelsResponseModel,
    api=blueprint.pro_public_schema_v2,
)
def list_students_levels() -> public_api_collective_offers_serialize.CollectiveOffersListStudentLevelsResponseModel:
    # in French, to be used by Swagger for the API documentation
    """Récupération de la liste des publics cibles pour lesquelles des offres collectives peuvent être proposées."""
    return public_api_collective_offers_serialize.CollectiveOffersListStudentLevelsResponseModel(
        __root__=[
            public_api_collective_offers_serialize.CollectiveOffersStudentLevelResponseModel(
                id=student_level.name, name=student_level.value
            )
            for student_level in educational_models.StudentLevels
        ]
    )
