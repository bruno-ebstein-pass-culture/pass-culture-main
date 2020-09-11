from decimal import Decimal
from typing import Dict, Optional

from domain.fnac import can_be_synchronized_with_fnac
from domain.libraires import can_be_synchronized_with_libraires
from domain.titelive import can_be_synchronized_with_titelive
from local_providers import AllocineStocks, LibrairesStocks, TiteLiveStocks, FnacStocks
from local_providers.local_provider import LocalProvider
from local_providers.price_rule import PriceRule
from models import AllocineVenueProvider, VenueSQLEntity, VenueProvider, AllocineVenueProviderPriceRule, ApiErrors
from repository import repository
from repository.allocine_pivot_queries import get_allocine_theaterId_for_venue
from repository.venue_queries import find_by_id
from utils.human_ids import dehumanize
from validation.routes.venues import check_existing_venue

STANDARDIZED_PROVIDERS = [LibrairesStocks, TiteLiveStocks, FnacStocks]
ERROR_CODE_PROVIDER_NOT_SUPPORTED = 400
ERROR_CODE_SIRET_NOT_SUPPORTED = 422


def connect_provider_to_venue(provider_class: LocalProvider, venue_provider_payload: Dict) -> VenueProvider:
    venue_id = dehumanize(venue_provider_payload['venueId'])
    venue = find_by_id(venue_id)
    check_existing_venue(venue)
    if provider_class == AllocineStocks:
        new_venue_provider = _connect_allocine_to_venue(venue, venue_provider_payload)
    elif provider_class in STANDARDIZED_PROVIDERS:
        _check_venue_can_be_synchronized_with_provider(venue, provider_class)
        new_venue_provider = _connect_standardized_providers_to_venue(venue, venue_provider_payload)
    else:
        errors = ApiErrors()
        errors.status_code = ERROR_CODE_PROVIDER_NOT_SUPPORTED
        errors.add_error('provider', 'Provider non pris en charge')
        raise errors

    return new_venue_provider


def _connect_allocine_to_venue(venue: VenueSQLEntity, payload: Dict) -> AllocineVenueProvider:
    allocine_theater_id = get_allocine_theaterId_for_venue(venue)
    allocine_venue_provider = _create_allocine_venue_provider(allocine_theater_id, payload, venue)
    allocine_venue_provider_price_rule = _create_allocine_venue_provider_price_rule(allocine_venue_provider,
                                                                                    payload.get('price'))

    repository.save(allocine_venue_provider_price_rule)

    return allocine_venue_provider


def _check_venue_can_be_synchronized_with_provider(venue: VenueSQLEntity, provider_class: LocalProvider):
    errors = ApiErrors()
    if not venue.siret:
        errors.status_code = ERROR_CODE_SIRET_NOT_SUPPORTED
        errors.add_error('provider', _get_synchronization_error_message(provider_class.name, venue.siret))
    elif provider_class == LibrairesStocks and not can_be_synchronized_with_libraires(venue.siret):
        errors.status_code = ERROR_CODE_SIRET_NOT_SUPPORTED
        errors.add_error('provider', _get_synchronization_error_message('Libraires', venue.siret))
    elif provider_class == TiteLiveStocks and not check_venue_can_be_synchronized_with_titelive(venue):
        errors.status_code = ERROR_CODE_SIRET_NOT_SUPPORTED
        errors.add_error('provider', _get_synchronization_error_message('Titelive', venue.siret))
    elif provider_class == FnacStocks and not check_venue_can_be_synchronized_with_fnac(venue):
        errors.status_code = ERROR_CODE_SIRET_NOT_SUPPORTED
        errors.add_error('provider', _get_synchronization_error_message('Fnac', venue.siret))

    print(errors.errors)
    if len(errors.errors) > 1:
        raise errors


def _connect_standardized_providers_to_venue(venue: VenueSQLEntity, payload: Dict) -> VenueProvider:
    venue_provider = VenueProvider()
    venue_provider.venue = venue
    venue_provider.providerId = dehumanize(payload['providerId'])
    venue_provider.venueIdAtOfferProvider = venue.siret

    repository.save(venue_provider)
    return venue_provider


def _create_allocine_venue_provider_price_rule(allocine_venue_provider: VenueProvider,
                                               price: Decimal) -> AllocineVenueProviderPriceRule:
    venue_provider_price_rule = AllocineVenueProviderPriceRule()
    venue_provider_price_rule.allocineVenueProvider = allocine_venue_provider
    venue_provider_price_rule.priceRule = PriceRule.default
    venue_provider_price_rule.price = price

    return venue_provider_price_rule


def _create_allocine_venue_provider(allocine_theater_id: str, payload: Dict,
                                    venue: VenueSQLEntity) -> AllocineVenueProvider:
    allocine_venue_provider = AllocineVenueProvider()
    allocine_venue_provider.venue = venue
    allocine_venue_provider.providerId = dehumanize(payload['providerId'])
    allocine_venue_provider.venueIdAtOfferProvider = allocine_theater_id
    allocine_venue_provider.isDuo = payload.get('isDuo')
    allocine_venue_provider.quantity = payload.get('quantity')

    return allocine_venue_provider


def check_venue_can_be_synchronized_with_libraires(venue: VenueSQLEntity):
    if not venue.siret or not can_be_synchronized_with_libraires(venue.siret):
        errors = ApiErrors()
        errors.status_code = ERROR_CODE_SIRET_NOT_SUPPORTED
        errors.add_error('provider', _get_synchronization_error_message('LesLibraires', venue.siret))
        raise errors


def check_venue_can_be_synchronized_with_titelive(venue: VenueSQLEntity):
    if not venue.siret or not can_be_synchronized_with_titelive(venue.siret):
        errors = ApiErrors()
        errors.status_code = ERROR_CODE_SIRET_NOT_SUPPORTED
        errors.add_error('provider', _get_synchronization_error_message('Titelive', venue.siret))
        raise errors


def check_venue_can_be_synchronized_with_fnac(venue: VenueSQLEntity):
    if not venue.siret or not can_be_synchronized_with_fnac(venue.siret):
        errors = ApiErrors()
        errors.status_code = ERROR_CODE_SIRET_NOT_SUPPORTED
        errors.add_error('provider', _get_synchronization_error_message('FNAC', venue.siret))
        raise errors


def _get_synchronization_error_message(provider_name: str, siret: Optional[str]) -> str:
    if siret:
        return f'L’importation d’offres avec {provider_name} n’est pas disponible pour le SIRET {siret}'
    else:
        return f'L’importation d’offres avec {provider_name} n’est pas disponible sans SIRET associé au lieu. Ajoutez un SIRET pour pouvoir importer les offres.'
