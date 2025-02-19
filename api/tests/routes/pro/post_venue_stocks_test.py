from decimal import Decimal
from unittest.mock import patch

import pytest

import pcapi.core.offerers.factories as offerers_factories
import pcapi.core.offers.factories as offers_factories
import pcapi.core.providers.factories as providers_factories


pytestmark = pytest.mark.usefixtures("db_session")


def test_accepts_request(client):
    providers_factories.ProviderFactory(name="Pass Culture API Stocks", localClass="PCAPIStocks")
    offerer = offerers_factories.OffererFactory(siren=123456789)
    venue = offerers_factories.VenueFactory(managingOfferer=offerer, id=3)
    offer_to_update = offers_factories.OfferFactory(
        product__idAtProviders="123456789",
        product__subcategoryId="LIVRE_PAPIER",
        idAtProvider="123456789",
        venue=venue,
    )
    offerers_factories.ApiKeyFactory(offerer=offerer)

    client.auth_header = {"Authorization": "Bearer " + offerers_factories.DEFAULT_CLEAR_API_KEY}

    response = client.post(
        f"/v2/venue/{venue.id}/stocks",
        json={
            "stocks": [
                {"ref": "123456789", "available": 4, "price": 30},
                {"ref": "1234567890", "available": 0, "price": 10},
            ]
        },
    )

    assert response.status_code == 204
    assert len(offer_to_update.stocks) == 1
    assert offer_to_update.stocks[0].quantity == 4
    assert offer_to_update.stocks[0].price == 30


@pytest.mark.parametrize(
    "price,expected_price",
    [(None, 10), ("", 0), ("0", 0), (0, 0), (1.23, Decimal("1.23")), ("1.23", Decimal("1.23"))],
)
def test_accepts_request_with_price(price, expected_price, client):
    providers_factories.ProviderFactory(name="Pass Culture API Stocks", localClass="PCAPIStocks")
    offerer = offerers_factories.OffererFactory(siren=123456789)
    venue = offerers_factories.VenueFactory(managingOfferer=offerer)
    offer_to_update = offers_factories.OfferFactory(
        product__idAtProviders="123456789",
        product__subcategoryId="LIVRE_PAPIER",
        idAtProvider="123456789",
        product__extraData={"prix_livre": expected_price},
        venue=venue,
    )
    offerers_factories.ApiKeyFactory(offerer=offerer)

    client.auth_header = {"Authorization": "Bearer " + offerers_factories.DEFAULT_CLEAR_API_KEY}

    response = client.post(
        f"/v2/venue/{venue.id}/stocks", json={"stocks": [{"ref": "123456789", "available": 4, "price": price}]}
    )

    assert response.status_code == 204
    assert offer_to_update.stocks[0].price == expected_price


@patch("pcapi.core.providers.api.synchronize_stocks")
def test_requires_an_api_key(mock_synchronize_stocks, client):
    offerer = offerers_factories.OffererFactory(siren=123456789)
    offerers_factories.VenueFactory(managingOfferer=offerer, id=3)

    mock_synchronize_stocks.return_value = {}

    response = client.post("/v2/venue/3/stocks", json={"stocks": [{"ref": "123456789", "available": 4}]})

    assert response.status_code == 401
    mock_synchronize_stocks.assert_not_called()


@patch("pcapi.core.providers.api.synchronize_stocks")
def test_returns_404_if_api_key_cant_access_venue(mock_synchronize_stocks, client):
    offerer = offerers_factories.OffererFactory(siren=123456789)
    offerers_factories.VenueFactory(managingOfferer=offerer, id=3)

    offerer2 = offerers_factories.OffererFactory(siren=123456780)
    offerers_factories.ApiKeyFactory(offerer=offerer2)

    mock_synchronize_stocks.return_value = {}

    client.auth_header = {"Authorization": "Bearer " + offerers_factories.DEFAULT_CLEAR_API_KEY}

    response1 = client.post("/v2/venue/3/stocks", json={"stocks": [{"ref": "123456789", "available": 4}]})
    response2 = client.post("/v2/venue/123/stocks", json={"stocks": [{"ref": "123456789", "available": 4}]})

    assert response1.status_code == 404
    assert response2.status_code == 404
    mock_synchronize_stocks.assert_not_called()


@patch("pcapi.core.providers.api.synchronize_stocks")
def test_returns_comprehensive_errors(mock_synchronize_stocks, client):
    offerers_factories.ApiKeyFactory()

    mock_synchronize_stocks.return_value = {}

    client.auth_header = {"Authorization": "Bearer " + offerers_factories.DEFAULT_CLEAR_API_KEY}

    response1 = client.post("/v2/venue/3/stocks", json={})
    response2 = client.post(
        "/v2/venue/3/stocks",
        json={
            "stocks": [
                {"ref": "123456789"},
                {"wrong_key": "123456789"},
                {"ref": "1234567890", "available": "abc"},
                {"ref": "12345678901", "available": -3},
            ]
        },
    )

    assert response1.status_code == 400
    assert response1.json["stocks"] == ["Ce champ est obligatoire"]
    assert response2.status_code == 400
    assert response2.json["stocks.0.available"] == ["Ce champ est obligatoire"]
    assert response2.json["stocks.1.available"] == ["Ce champ est obligatoire"]
    assert response2.json["stocks.1.ref"] == ["Ce champ est obligatoire"]
    assert response2.json["stocks.2.available"] == ["Saisissez un nombre valide"]
    assert response2.json["stocks.3.available"] == ["Saisissez un nombre supérieur ou égal à 0"]
    mock_synchronize_stocks.assert_not_called()
