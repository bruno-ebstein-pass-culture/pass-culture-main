import datetime
from unittest import mock

from flask import url_for
import pytest

from pcapi.core.finance import factories as finance_factories
from pcapi.core.history import factories as history_factories
from pcapi.core.history import models as history_models
from pcapi.core.offerers import factories as offerers_factories
from pcapi.core.permissions import models as perm_models
from pcapi.core.testing import assert_num_queries
from pcapi.utils.human_ids import humanize

from .helpers import html_parser
from .helpers.get import GetEndpointHelper


pytestmark = [
    pytest.mark.usefixtures("db_session"),
    pytest.mark.backoffice,
]


class GetBankAccountTest(GetEndpointHelper):
    endpoint = "backoffice_web.bank_account.get"
    endpoint_kwargs = {"bank_account_id": 1}
    needed_permission = perm_models.Permissions.READ_PRO_ENTITY

    # get session (1 query)
    # get user with profile and permissions (1 query)
    # get bank_account (1 query)
    expected_num_queries = 3

    def test_get_bank_account(self, authenticated_client):
        bank_account = finance_factories.BankAccountFactory()

        url = url_for(self.endpoint, bank_account_id=bank_account.id)

        with assert_num_queries(self.expected_num_queries):
            response = authenticated_client.get(url)
            assert response.status_code == 200

        response_text = html_parser.content_as_text(response.data)
        assert bank_account.label in response_text
        assert f"Bank Account ID : {bank_account.id} " in response_text
        assert f"Humanized ID : {humanize(bank_account.id)} " in response_text
        assert f"IBAN : {bank_account.iban} " in response_text
        assert f"BIC : {bank_account.bic} " in response_text
        assert "Statut dossier DMS Adage :" not in response_text
        assert "Pas de dossier DMS CB" in response_text
        assert "ACCÉDER AU DOSSIER DMS CB" not in response_text

    def test_get_venue_dms_stats(self, authenticated_client):
        with mock.patch("pcapi.connectors.dms.api.DMSGraphQLClient.get_bank_info_status") as bank_info_mock:
            bank_info_mock.return_value = {
                "dossier": {
                    "state": "en_construction",
                    "dateDepot": "2022-09-21T16:30:22+02:00",
                    "dateDerniereModification": "2022-09-22T16:30:22+02:00",
                }
            }
            bank_account = finance_factories.BankAccountFactory()

            url = url_for(self.endpoint, bank_account_id=bank_account.id)

            with assert_num_queries(self.expected_num_queries):
                response = authenticated_client.get(url)
                assert response.status_code == 200

        # then
        response_text = html_parser.content_as_text(response.data)
        assert "Statut DMS CB : En construction" in response_text
        assert "Date de dépôt du dossier DMS CB : 21/09/2022" in response_text
        assert "Date de validation du dossier DMS CB" not in response_text
        assert "ACCÉDER AU DOSSIER DMS CB" in response_text

    def test_get_venue_dms_stats_for_accepted_file(self, authenticated_client, venue_with_draft_bank_info):
        with mock.patch("pcapi.connectors.dms.api.DMSGraphQLClient.get_bank_info_status") as bank_info_mock:
            bank_info_mock.return_value = {
                "dossier": {
                    "state": "accepte",
                    "dateDepot": "2022-09-21T16:30:22+02:00",
                    "dateDerniereModification": "2022-09-23T16:30:22+02:00",
                }
            }
            bank_account = finance_factories.BankAccountFactory()

            url = url_for(self.endpoint, bank_account_id=bank_account.id)

            with assert_num_queries(self.expected_num_queries):
                response = authenticated_client.get(url)
                assert response.status_code == 200

        response_text = html_parser.content_as_text(response.data)
        assert "Statut DMS CB : Accepté" in response_text
        assert "Date de validation du dossier DMS CB : 23/09/2022" in response_text
        assert "Date de dépôt du dossier DMS CB" not in response_text
        assert "ACCÉDER AU DOSSIER DMS CB" in response_text


class GetBankAccountVenuesTest(GetEndpointHelper):
    endpoint = "backoffice_web.bank_account.get_linked_venues"
    endpoint_kwargs = {"bank_account_id": 1}
    needed_permission = perm_models.Permissions.READ_PRO_ENTITY

    # - session + authenticated user (2 queries)
    # - venues with joined data (1 query)
    expected_num_queries = 3

    def test_get_linked_venues(self, authenticated_client):
        bank_account = finance_factories.BankAccountFactory()
        bank_account2 = finance_factories.BankAccountFactory()

        offerer = offerers_factories.OffererFactory()
        venue_1 = offerers_factories.VenueFactory(managingOfferer=offerer)
        venue_2 = offerers_factories.VenueFactory(managingOfferer=offerer)

        link_venue1_date = datetime.datetime(2022, 10, 3, 13, 1)
        offerers_factories.VenueBankAccountLinkFactory(
            venue=venue_1, bankAccount=bank_account, timespan=(link_venue1_date,)
        )
        link_venue2_date = datetime.datetime(2023, 8, 4, 14, 2)
        offerers_factories.VenueBankAccountLinkFactory(
            venue=venue_2, bankAccount=bank_account, timespan=(link_venue2_date,)
        )

        offerers_factories.VenueBankAccountLinkFactory(venue=venue_1, bankAccount=bank_account2)

        # Don't interfere
        other_offerer = offerers_factories.OffererFactory()
        offerers_factories.VenueFactory(managingOfferer=other_offerer)

        url = url_for(self.endpoint, bank_account_id=bank_account.id)

        with assert_num_queries(self.expected_num_queries):
            response = authenticated_client.get(url)
            assert response.status_code == 200

        rows = html_parser.extract_table_rows(response.data)
        assert len(rows) == 2

        # Sort before checking rows data to avoid flaky test
        rows = sorted(rows, key=lambda row: int(row["ID"]))

        assert rows[0]["ID"] == str(venue_1.id)
        assert rows[0]["Nom"] == venue_1.name
        assert rows[0]["Date de rattachement"].startswith(link_venue1_date.strftime("%d/%m/%Y à "))

        assert rows[1]["ID"] == str(venue_2.id)
        assert rows[1]["Nom"] == venue_2.name
        assert rows[1]["Date de rattachement"].startswith(link_venue2_date.strftime("%d/%m/%Y à "))


class GetOffererHistoryTest(GetEndpointHelper):
    endpoint = "backoffice_web.bank_account.get_history"
    endpoint_kwargs = {"bank_account_id": 1}
    needed_permission = perm_models.Permissions.READ_PRO_ENTITY

    # - session + authenticated user (2 queries)
    # - full history with joined data (1 query)
    expected_num_queries = 3

    def test_no_action(self, authenticated_client):
        bank_account = finance_factories.BankAccountFactory()

        url = url_for(self.endpoint, bank_account_id=bank_account.id)

        with assert_num_queries(self.expected_num_queries):
            response = authenticated_client.get(url)
            assert response.status_code == 200

        assert html_parser.count_table_rows(response.data) == 0

    def test_get_history(self, authenticated_client, legit_user):
        bank_account = finance_factories.BankAccountFactory()

        action = history_factories.ActionHistoryFactory(
            bankAccount=bank_account,
            actionType=history_models.ActionType.LINK_VENUE_BANK_ACCOUNT_CREATED,
            authorUser=legit_user,
            user=legit_user,
        )

        url = url_for(self.endpoint, bank_account_id=bank_account.id)

        with assert_num_queries(self.expected_num_queries):
            response = authenticated_client.get(url)
            assert response.status_code == 200

        rows = html_parser.extract_table_rows(response.data)
        assert len(rows) == 1
        assert rows[0]["Type"] == history_models.ActionType.LINK_VENUE_BANK_ACCOUNT_CREATED.value
        assert rows[0]["Date/Heure"].startswith(action.actionDate.strftime("Le %d/%m/%Y à "))
        assert rows[0]["Auteur"] == action.authorUser.full_name

    def test_get_full_sorted_history(self, authenticated_client, legit_user):
        # given
        bank_account = finance_factories.BankAccountFactory()

        link_action = history_factories.ActionHistoryFactory(
            actionDate=datetime.datetime(2022, 10, 3, 13, 1),
            actionType=history_models.ActionType.LINK_VENUE_BANK_ACCOUNT_CREATED,
            authorUser=legit_user,
            user=legit_user,
            bankAccount=bank_account,
        )
        unlink_action = history_factories.ActionHistoryFactory(
            actionDate=datetime.datetime(2022, 10, 4, 14, 2),
            actionType=history_models.ActionType.LINK_VENUE_BANK_ACCOUNT_DEPRECATED,
            authorUser=legit_user,
            user=legit_user,
            bankAccount=bank_account,
        )

        url = url_for(self.endpoint, bank_account_id=bank_account.id)

        # when
        with assert_num_queries(self.expected_num_queries):
            response = authenticated_client.get(url)
            assert response.status_code == 200

        # then
        rows = html_parser.extract_table_rows(response.data)
        assert len(rows) == 2

        assert rows[0]["Type"] == "Lieu dissocié d'un compte bancaire"
        assert rows[0]["Date/Heure"].startswith(unlink_action.actionDate.strftime("Le %d/%m/%Y à "))
        assert rows[0]["Auteur"] == legit_user.full_name

        assert rows[1]["Type"] == "Lieu associé à un compte bancaire"
        assert rows[1]["Date/Heure"].startswith(link_action.actionDate.strftime("Le %d/%m/%Y à "))
        assert rows[1]["Auteur"] == legit_user.full_name
