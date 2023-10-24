from datetime import datetime
from datetime import timedelta

from freezegun import freeze_time
import pytest

import pcapi.core.offerers.factories as offerers_factories
import pcapi.core.offers.factories as offers_factories
import pcapi.core.users.factories as users_factories

from tests.conftest import TestClient


@pytest.mark.usefixtures("db_session")
class Returns403Test:
    def test_access_by_beneficiary(self, client):
        # Given
        beneficiary = users_factories.BeneficiaryGrant18Factory()
        offer = offers_factories.ThingOfferFactory(venue__latitude=None, venue__longitude=None)

        # When
        response = client.with_session_auth(email=beneficiary.email).get(f"/offers/{offer.id}/stocks-stats")

        # Then
        assert response.status_code == 403

    def test_access_by_unauthorized_pro_user(self, app):
        # Given
        pro_user = users_factories.ProFactory()
        offer = offers_factories.ThingOfferFactory(venue__latitude=None, venue__longitude=None)

        # When
        client = TestClient(app.test_client()).with_session_auth(email=pro_user.email)
        response = client.get(f"/offers/{offer.id}/stocks-stats")

        # Then
        assert response.status_code == 403


@pytest.mark.usefixtures("db_session")
class Returns200Test:
    def test_basic(self, client):
        # Given
        user_offerer = offerers_factories.UserOffererFactory()
        offer = offers_factories.ThingOfferFactory(venue__managingOfferer=user_offerer.offerer)
        offers_factories.StockFactory(offer=offer)

        # When
        response = client.with_session_auth(email=user_offerer.user.email).get(f"/offers/{offer.id}/stocks-stats")
        print(response.json)

        # Then
        assert response.status_code == 200

    @freeze_time("2020-10-15 00:00:00")
    def test_returns_stats(self, client):
        # Given
        now = datetime.utcnow()
        user_offerer = offerers_factories.UserOffererFactory()
        offer = offers_factories.OfferFactory(venue__managingOfferer=user_offerer.offerer)
        offers_factories.StockFactory(
            beginningDatetime=now + timedelta(hours=1),
            quantity=20,
            dnBookedQuantity=10,
            offer=offer,
        )
        offers_factories.StockFactory(
            beginningDatetime=now + timedelta(hours=2),
            quantity=30,
            dnBookedQuantity=25,
            offer=offer,
        )

        # When
        response = client.with_session_auth(email=user_offerer.user.email).get(f"/offers/{offer.id}/stocks-stats")

        # Then
        assert response.status_code == 200
        assert response.json == {
            "stock_count": 2,
            "oldest_stock": "2020-10-15T01:00:00",
            "newest_stock": "2020-10-15T02:00:00",
            "remaining_quantity": 15,
        }