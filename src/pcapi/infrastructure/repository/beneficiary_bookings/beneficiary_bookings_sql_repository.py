from typing import List

from pcapi.domain.beneficiary_bookings.beneficiary_booking import BeneficiaryBooking
from pcapi.domain.beneficiary_bookings.beneficiary_bookings_with_stocks import BeneficiaryBookingsWithStocks
from pcapi.domain.beneficiary_bookings.beneficiary_bookings_repository import BeneficiaryBookingsRepository
from pcapi.infrastructure.repository.beneficiary_bookings import stock_domain_converter, active_mediation_domain_converter
from pcapi.models import Booking, UserSQLEntity, StockSQLEntity, OfferSQLEntity, VenueSQLEntity, MediationSQLEntity, Product


class BeneficiaryBookingsSQLRepository(BeneficiaryBookingsRepository):
    def get_beneficiary_bookings(self, beneficiary_id: int) -> BeneficiaryBookingsWithStocks:
        booking_sql_entity_views = _get_bookings_information(beneficiary_id)

        offers_ids = [booking.offerId for booking in booking_sql_entity_views]
        stock_sql_entity_views = _get_stocks_information(offers_ids)
        mediations_sql_entity_views = _get_mediations_information(offers_ids)
        mediations = [active_mediation_domain_converter.to_domain(mediation) for mediation in
                      mediations_sql_entity_views]
        stocks = [stock_domain_converter.to_domain(stock) for stock in stock_sql_entity_views]

        beneficiary_bookings = []
        for booking in booking_sql_entity_views:
            beneficiary_bookings.append(
                BeneficiaryBooking(
                    amount=booking.amount,
                    cancellationDate=booking.cancellationDate,
                    dateCreated=booking.dateCreated,
                    dateUsed=booking.dateUsed,
                    id=booking.id,
                    isCancelled=booking.isCancelled,
                    isUsed=booking.isUsed,
                    quantity=booking.quantity,
                    recommendationId=booking.recommendationId,
                    stockId=booking.stockId,
                    token=booking.token,
                    userId=booking.userId,
                    offerId=booking.offerId,
                    name=booking.name,
                    type=booking.type,
                    url=booking.url,
                    email=booking.email,
                    beginningDatetime=booking.beginningDatetime,
                    venueId=booking.venueId,
                    departementCode=booking.departementCode,
                    withdrawalDetails=booking.withdrawalDetails,
                    isDuo=booking.isDuo,
                    extraData=booking.extraData,
                    durationMinutes=booking.durationMinutes,
                    description=booking.description,
                    isNational=booking.isNational,
                    mediaUrls=booking.mediaUrls,
                    venueName=booking.venueName,
                    address=booking.address,
                    postalCode=booking.postalCode,
                    city=booking.city,
                    latitude=booking.latitude,
                    longitude=booking.longitude,
                    price=booking.price,
                    productId=booking.productId,
                    thumbCount=booking.thumbCount,
                    active_mediations=[mediation for mediation in mediations if mediation.offer_id == booking.offerId],
                )
            )
        return BeneficiaryBookingsWithStocks(bookings=beneficiary_bookings, stocks=stocks)


def _get_mediations_information(offers_ids: List[int]) -> List[object]:
    return MediationSQLEntity.query \
        .join(OfferSQLEntity, OfferSQLEntity.id == MediationSQLEntity.offerId) \
        .filter(MediationSQLEntity.offerId.in_(offers_ids)) \
        .filter(MediationSQLEntity.isActive == True) \
        .with_entities(MediationSQLEntity.id,
                       MediationSQLEntity.dateCreated,
                       MediationSQLEntity.offerId) \
        .all()


def _get_stocks_information(offers_ids: List[int]) -> List[object]:
    return StockSQLEntity.query \
        .join(OfferSQLEntity, OfferSQLEntity.id == StockSQLEntity.offerId) \
        .filter(StockSQLEntity.offerId.in_(offers_ids)) \
        .with_entities(StockSQLEntity.dateCreated,
                       StockSQLEntity.beginningDatetime,
                       StockSQLEntity.bookingLimitDatetime,
                       StockSQLEntity.dateModified,
                       StockSQLEntity.offerId,
                       StockSQLEntity.quantity,
                       StockSQLEntity.price,
                       StockSQLEntity.id,
                       StockSQLEntity.isSoftDeleted,
                       OfferSQLEntity.isActive) \
        .all()


def _get_bookings_information(beneficiary_id: int) -> List[object]:
    offer_activation_types = ['ThingType.ACTIVATION', 'EventType.ACTIVATION']
    return Booking.query \
        .join(UserSQLEntity, UserSQLEntity.id == Booking.userId) \
        .join(StockSQLEntity, StockSQLEntity.id == Booking.stockId) \
        .join(OfferSQLEntity) \
        .join(Product, OfferSQLEntity.productId == Product.id) \
        .join(VenueSQLEntity) \
        .filter(Booking.userId == beneficiary_id) \
        .filter(OfferSQLEntity.type.notin_(offer_activation_types)) \
        .distinct(Booking.stockId) \
        .order_by(Booking.stockId,
                  Booking.isCancelled,
                  Booking.dateCreated.desc()
                  ) \
        .with_entities(Booking.amount,
                       Booking.cancellationDate,
                       Booking.dateCreated,
                       Booking.dateUsed,
                       Booking.id,
                       Booking.isCancelled,
                       Booking.isUsed,
                       Booking.quantity,
                       Booking.recommendationId,
                       Booking.stockId,
                       Booking.token,
                       Booking.userId,
                       OfferSQLEntity.id.label("offerId"),
                       OfferSQLEntity.name,
                       OfferSQLEntity.type,
                       OfferSQLEntity.url,
                       OfferSQLEntity.withdrawalDetails,
                       OfferSQLEntity.isDuo,
                       OfferSQLEntity.extraData,
                       OfferSQLEntity.durationMinutes,
                       OfferSQLEntity.description,
                       OfferSQLEntity.mediaUrls,
                       OfferSQLEntity.isNational,
                       Product.id.label("productId"),
                       Product.thumbCount,
                       UserSQLEntity.email,
                       StockSQLEntity.beginningDatetime,
                       StockSQLEntity.price,
                       VenueSQLEntity.id.label("venueId"),
                       VenueSQLEntity.departementCode,
                       VenueSQLEntity.name.label("venueName"),
                       VenueSQLEntity.address,
                       VenueSQLEntity.postalCode,
                       VenueSQLEntity.city,
                       VenueSQLEntity.latitude,
                       VenueSQLEntity.longitude,
                       ) \
        .all()
