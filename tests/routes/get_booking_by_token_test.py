import pytest
from datetime import datetime
from urllib.parse import urlencode

from models import PcObject, EventType
from models.pc_object import serialize
from tests.conftest import clean_database, TestClient
from tests.test_utils import API_URL, create_stock_with_thing_offer, \
    create_venue, create_offerer, \
    create_user, create_booking, create_event_offer, \
    create_event_occurrence, create_stock_from_event_occurrence, create_user_offerer
from utils.human_ids import humanize


@pytest.mark.standalone
class Get:
    class Returns200:
        @clean_database
        def when_user_has_rights_and_regular_offer(self, app):
            # Given
            user = create_user(public_name='John Doe', email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            user_offerer = create_user_offerer(admin_user, offerer)
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Event Name', event_type=EventType.CINEMA)
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(user_offerer, booking, event_occurrence)

            expected_json = {'bookingId': humanize(booking.id),
                             'date': serialize(booking.stock.eventOccurrence.beginningDatetime),
                             'email': 'user@email.fr',
                             'isUsed': False,
                             'offerName': 'Event Name',
                             'userName': 'John Doe',
                             'venueDepartementCode': '93'}

            # When
            response = TestClient().with_auth('admin@email.fr', 'P@55w0rd').get(
                API_URL + '/bookings/token/{}'.format(booking.token))
            # Then
            assert response.status_code == 200
            response_json = response.json()
            assert response_json == expected_json

        @clean_database
        def when_activation_event_and_user_has_rights(self, app):
            # Given
            user = create_user(email='user@email.fr', phone_number='0698765432', date_of_birth=datetime(2001, 2, 1))
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd', is_admin=True, can_book_free_offers=False)
            offerer = create_offerer()
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Offre d\'activation', event_type=EventType.ACTIVATION)
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(admin_user, booking, event_occurrence)

            expected_json = {'bookingId': humanize(booking.id),
                             'date': serialize(booking.stock.eventOccurrence.beginningDatetime),
                             'dateOfBirth': '2001-02-01T00:00:00Z',
                             'email': 'user@email.fr',
                             'isUsed': False,
                             'offerName': 'Offre d\'activation',
                             'phoneNumber': '0698765432',
                             'userName': 'John Doe',
                             'venueDepartementCode': '93'}

            # When
            response = TestClient() \
                .with_auth('admin@email.fr', 'P@55w0rd') \
                .get(API_URL + '/bookings/token/{}'.format(booking.token))

            # Then
            assert response.status_code == 200
            response_json = response.json()
            assert response_json == expected_json

        @clean_database
        def when_user_has_rights_and_email_with_special_characters_url_encoded(self, app):
            # Given
            user = create_user(email='user+plus@email.fr')
            user_admin = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            user_offerer = create_user_offerer(user_admin, offerer, is_admin=True)
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Event Name')
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(user_offerer, booking, event_occurrence)
            url_email = urlencode({'email': 'user+plus@email.fr'})
            url = API_URL + '/bookings/token/{}?{}'.format(booking.token, url_email)

            # When
            response = TestClient().with_auth('admin@email.fr', 'P@55w0rd').get(url)
            # Then
            assert response.status_code == 200

    class Returns204:

        @clean_database
        def when_user_doesnt_have_rights_and_token_exists(self, app):
            # Given
            user = create_user(email='user@email.fr')
            querying_user = create_user(email='querying@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Event Name')
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(querying_user, booking, event_occurrence)

            # When
            response = TestClient().with_auth('querying@email.fr', 'P@55w0rd').get(
                API_URL + '/bookings/token/{}'.format(booking.token))
            # Then
            assert response.status_code == 204

        @clean_database
        def when_user_not_logged_in_and_gives_right_email(self, app):
            # Given
            user = create_user(email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Event Name')
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(admin_user, booking, event_occurrence)

            url = API_URL + '/bookings/token/{}?email={}'.format(booking.token, 'user@email.fr')
            # When
            response = TestClient().get(url)
            # Then
            assert response.status_code == 204

        @clean_database
        def when_user_not_logged_in_and_give_right_email_and_event_offer_id(self, app):
            # Given
            user = create_user(email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Event Name')
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(admin_user, booking, event_occurrence)
            url = API_URL + '/bookings/token/{}?email={}&offer_id={}'.format(booking.token, 'user@email.fr',
                                                                             humanize(offer.id))

            # When
            response = TestClient().get(url)

            # Then
            assert response.status_code == 204

        @clean_database
        def when_not_logged_in_and_give_right_email_and_offer_id_thing(self, app):
            # Given
            user = create_user(email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            stock = create_stock_with_thing_offer(offerer, venue, thing_offer=None, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(admin_user, booking)
            url = API_URL + '/bookings/token/{}?email={}&offer_id={}'.format(booking.token, 'user@email.fr',
                                                                             humanize(stock.offerId))

            # When
            response = TestClient().get(url)
            # Then
            assert response.status_code == 204

    class Returns404:

        @clean_database
        def when_token_user_has_rights_but_token_not_found(self, app):
            # Given
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            PcObject.check_and_save(admin_user)

            # When
            response = TestClient().with_auth('admin@email.fr', 'P@55w0rd').get(
                API_URL + '/bookings/token/{}'.format('12345'))
            # Then
            assert response.status_code == 404
            assert response.json()['global'] == ["Cette contremarque n'a pas été trouvée"]

        @clean_database
        def when_user_not_logged_in_and_wrong_email(self, app):
            # Given
            user = create_user(email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Event Name')
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(admin_user, booking, event_occurrence)

            # When
            url = API_URL + '/bookings/token/{}?email={}'.format(booking.token, 'toto@email.fr')
            response = TestClient().with_auth('admin@email.fr', 'P@55w0rd').get(url)
            # Then
            assert response.status_code == 404
            assert response.json()['global'] == ["Cette contremarque n'a pas été trouvée"]

        @clean_database
        def when_user_not_logged_in_right_email_and_wrong_offer(self, app):
            # Given
            user = create_user(email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            stock = create_stock_with_thing_offer(offerer, venue, thing_offer=None, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(admin_user, booking)
            url = API_URL + '/bookings/token/{}?email={}&offer_id={}'.format(booking.token, 'user@email.fr', humanize(123))

            # When
            response = TestClient().get(url)

            # Then
            assert response.status_code == 404
            assert response.json()['global'] == ["Cette contremarque n'a pas été trouvée"]

        @clean_database
        def when_user_has_rights_and_email_with_special_characters_not_url_encoded(self, app):
            # Given
            user = create_user(email='user+plus@email.fr')
            user_admin = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            user_offerer = create_user_offerer(user_admin, offerer, is_admin=True)
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Event Name')
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(user_offerer, booking, event_occurrence)
            url = API_URL + '/bookings/token/{}?email={}'.format(booking.token, user.email)

            # When
            response = TestClient().with_auth('admin@email.fr', 'P@55w0rd').get(url)
            # Then
            assert response.status_code == 404

    class Returns400:

        @clean_database
        def when_user_not_logged_in_and_doesnt_give_email(self, app):
            # Given
            user = create_user(email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            offer = create_event_offer(venue, event_name='Event Name')
            event_occurrence = create_event_occurrence(offer)
            stock = create_stock_from_event_occurrence(event_occurrence, price=0)
            booking = create_booking(user, stock, venue=venue)

            PcObject.check_and_save(admin_user, booking, event_occurrence)

            url = API_URL + '/bookings/token/{}'.format(booking.token)
            # When
            response = TestClient().get(url)
            # Then
            assert response.status_code == 400
            error_message = response.json()
            assert error_message['email'] == [
                'Vous devez préciser l\'email de l\'utilisateur quand vous n\'êtes pas connecté(e)']

    class Returns410:

        @clean_database
        def when_booking_is_already_validated(self, app):
            # Given
            user = create_user(email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            stock = create_stock_with_thing_offer(offerer, venue, thing_offer=None, price=0)
            booking = create_booking(user, stock, venue=venue, is_used=True)

            PcObject.check_and_save(admin_user, booking)
            url = API_URL + '/bookings/token/{}?email={}&offer_id={}'.format(booking.token, 'user@email.fr',
                                                                             humanize(stock.offerId))

            # When
            response = TestClient().get(url)
            # Then
            assert response.status_code == 410
            assert response.json()['booking'] == ['Cette réservation a déjà été validée']

        @clean_database
        def when_booking_is_cancelled(self, app):
            # Given
            user = create_user(email='user@email.fr')
            admin_user = create_user(email='admin@email.fr', password='P@55w0rd')
            offerer = create_offerer()
            venue = create_venue(offerer)
            stock = create_stock_with_thing_offer(offerer, venue, thing_offer=None, price=0)
            booking = create_booking(user, stock, venue=venue, is_cancelled=True)

            PcObject.check_and_save(admin_user, booking)
            url = API_URL + '/bookings/token/{}?email={}&offer_id={}'.format(booking.token, 'user@email.fr',
                                                                             humanize(stock.offerId))

            # When
            response = TestClient().get(url)
            # Then
            assert response.status_code == 410
            assert response.json()['booking'] == ['Cette réservation a été annulée']
