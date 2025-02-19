import logging

from flask import abort
from flask import request
from flask_login import current_user
from flask_login import login_required

from pcapi.core.categories import categories
from pcapi.core.categories import subcategories
from pcapi.core.offerers import exceptions as offerers_exceptions
from pcapi.core.offerers import repository as offerers_repository
from pcapi.core.offers import exceptions
import pcapi.core.offers.api as offers_api
from pcapi.core.offers.models import Offer
import pcapi.core.offers.repository as offers_repository
from pcapi.core.offers.validation import check_offer_withdrawal
from pcapi.models.api_errors import ApiErrors
from pcapi.models.feature import FeatureToggle
from pcapi.repository.offer_queries import get_offer_by_id
from pcapi.routes.apis import private_api
from pcapi.routes.serialization import offers_serialize
from pcapi.routes.serialization.offers_recap_serialize import serialize_offers_recap_paginated
from pcapi.routes.serialization.thumbnails_serialize import CreateThumbnailBodyModel
from pcapi.routes.serialization.thumbnails_serialize import CreateThumbnailResponseModel
from pcapi.serialization.decorator import spectree_serialize
from pcapi.utils.human_ids import dehumanize
from pcapi.workers.update_all_offers_active_status_job import update_all_offers_active_status_job

from . import blueprint


logger = logging.getLogger(__name__)
from pcapi.utils.rest import check_user_has_access_to_offerer
from pcapi.utils.rest import load_or_404


@private_api.route("/offers", methods=["GET"])
@login_required
@spectree_serialize(
    response_model=offers_serialize.ListOffersResponseModel,
    api=blueprint.pro_private_schema,
)
def list_offers(query: offers_serialize.ListOffersQueryModel) -> offers_serialize.ListOffersResponseModel:
    paginated_offers = offers_api.list_offers_for_pro_user(
        user_id=current_user.id,
        user_is_admin=current_user.has_admin_role,
        category_id=query.categoryId,
        offerer_id=query.offerer_id,
        venue_id=query.venue_id,
        name_keywords_or_isbn=query.nameOrIsbn,
        status=query.status,
        creation_mode=query.creation_mode,
        period_beginning_date=query.period_beginning_date,
        period_ending_date=query.period_ending_date,
    )

    return offers_serialize.ListOffersResponseModel(__root__=serialize_offers_recap_paginated(paginated_offers))


@private_api.route("/offers/<offer_id>", methods=["GET"])
@login_required
@spectree_serialize(
    response_model=offers_serialize.GetIndividualOfferResponseModel,
    api=blueprint.pro_private_schema,
)
def get_offer(offer_id: str) -> offers_serialize.GetIndividualOfferResponseModel:
    try:
        offer = offers_repository.get_offer_by_id(dehumanize(offer_id))  # type: ignore [arg-type]
    except exceptions.OfferNotFound:
        raise ApiErrors(
            errors={
                "global": ["Aucun objet ne correspond à cet identifiant dans notre base de données"],
            },
            status_code=404,
        )
    check_user_has_access_to_offerer(current_user, offer.venue.managingOffererId)

    return offers_serialize.GetIndividualOfferResponseModel.from_orm(offer)


@private_api.route("/offers", methods=["POST"])
@login_required
@spectree_serialize(
    response_model=offers_serialize.OfferResponseIdModel,
    on_success_status=201,
    api=blueprint.pro_private_schema,
)
def post_offer(body: offers_serialize.PostOfferBodyModel) -> offers_serialize.OfferResponseIdModel:
    try:
        check_offer_withdrawal(body.withdrawal_type, body.withdrawal_delay, body.subcategory_id)
        save_as_active = not FeatureToggle.OFFER_FORM_SUMMARY_PAGE.is_active()
        offer = offers_api.create_offer(offer_data=body, user=current_user, save_as_active=save_as_active)

    except exceptions.OfferCreationBaseException as error:
        raise ApiErrors(
            error.errors,
            status_code=400,
        )

    return offers_serialize.OfferResponseIdModel.from_orm(offer)


@private_api.route("/offers/publish", methods=["PATCH"])
@login_required
@spectree_serialize(
    on_success_status=204,
    on_error_statuses=[404, 403],
    api=blueprint.pro_private_schema,
)
def patch_publish_offer(body: offers_serialize.PatchOfferPublishBodyModel) -> None:
    if not FeatureToggle.OFFER_FORM_SUMMARY_PAGE.is_active():
        abort(404, "Cette fonctionnalité est en cours de développement")

    try:
        offerer = offerers_repository.get_by_offer_id(body.id)
    except offerers_exceptions.CannotFindOffererForOfferId:
        raise ApiErrors({"offerer": ["Aucune structure trouvée à partir de cette offre"]}, status_code=404)

    check_user_has_access_to_offerer(current_user, offerer.id)
    offers_api.publish_offer(body.id, current_user)


@private_api.route("/offers/active-status", methods=["PATCH"])
@login_required
@spectree_serialize(
    response_model=None,
    on_success_status=204,
    api=blueprint.pro_private_schema,
)
def patch_offers_active_status(body: offers_serialize.PatchOfferActiveStatusBodyModel) -> None:
    query = offers_repository.get_offers_by_ids(current_user, body.ids)
    collective_query = offers_repository.get_collective_offers_by_offer_ids(current_user, body.ids)
    collective_template_query = offers_repository.get_collective_offers_template_by_offer_ids(current_user, body.ids)
    offers_api.batch_update_offers(query, {"isActive": body.is_active})
    offers_api.batch_update_collective_offers(collective_query, {"isActive": body.is_active})
    if collective_template_query is not None:
        offers_api.batch_update_collective_offers_template(collective_template_query, {"isActive": body.is_active})


@private_api.route("/offers/all-active-status", methods=["PATCH"])
@login_required
@spectree_serialize(
    response_model=None,
    on_success_status=202,
    api=blueprint.pro_private_schema,
)
def patch_all_offers_active_status(
    body: offers_serialize.PatchAllOffersActiveStatusBodyModel,
) -> offers_serialize.PatchAllOffersActiveStatusResponseModel:
    filters = {
        "user_id": current_user.id,
        "is_user_admin": current_user.has_admin_role,
        "offerer_id": body.offerer_id,
        "status": body.status,
        "venue_id": body.venue_id,
        "category_id": body.category_id,
        "name_or_isbn": body.name_or_isbn,
        "creation_mode": body.creation_mode,
        "period_beginning_date": body.period_beginning_date,
        "period_ending_date": body.period_ending_date,
    }
    update_all_offers_active_status_job.delay(filters, body.is_active)
    return offers_serialize.PatchAllOffersActiveStatusResponseModel()


@private_api.route("/offers/<offer_id>", methods=["PATCH"])
@login_required
@spectree_serialize(
    response_model=offers_serialize.OfferResponseIdModel,
    api=blueprint.pro_private_schema,
)
def patch_offer(offer_id: str, body: offers_serialize.PatchOfferBodyModel) -> offers_serialize.OfferResponseIdModel:
    offer = load_or_404(Offer, human_id=offer_id)
    check_user_has_access_to_offerer(current_user, offer.venue.managingOffererId)  # type: ignore [attr-defined]

    offer = offers_api.update_offer(offer, **body.dict(exclude_unset=True))

    return offers_serialize.OfferResponseIdModel.from_orm(offer)


@private_api.route("/offers/thumbnails/", methods=["POST"])
@login_required
@spectree_serialize(
    on_success_status=201,
    response_model=CreateThumbnailResponseModel,
    api=blueprint.pro_private_schema,
)
def create_thumbnail(form: CreateThumbnailBodyModel) -> CreateThumbnailResponseModel:
    offer = get_offer_by_id(form.offer_id)
    check_user_has_access_to_offerer(current_user, offer.venue.managingOffererId)

    image_as_bytes = form.get_image_as_bytes(request)

    thumbnail = offers_api.create_mediation(
        user=current_user,
        offer=offer,
        credit=form.credit,  # type: ignore [arg-type]
        image_as_bytes=image_as_bytes,
        crop_params=form.crop_params,
    )

    return CreateThumbnailResponseModel(id=thumbnail.id)


@private_api.route("/offers/categories", methods=["GET"])
@login_required
@spectree_serialize(
    response_model=offers_serialize.CategoriesResponseModel,
    api=blueprint.pro_private_schema,
)
def get_categories() -> offers_serialize.CategoriesResponseModel:
    return offers_serialize.CategoriesResponseModel(
        categories=[
            offers_serialize.CategoryResponseModel.from_orm(category) for category in categories.ALL_CATEGORIES
        ],
        subcategories=[
            offers_serialize.SubcategoryResponseModel.from_orm(subcategory)
            for subcategory in subcategories.ALL_SUBCATEGORIES
        ],
    )
