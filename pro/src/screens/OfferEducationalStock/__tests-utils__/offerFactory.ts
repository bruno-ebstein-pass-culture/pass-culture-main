import {
  GetCollectiveOfferCollectiveStockResponseModel,
  OfferAddressType,
  OfferStatus,
  StudentLevels,
  SubcategoryIdEnum,
} from 'apiClient/v1'
import { CollectiveOffer, CollectiveOfferTemplate } from 'core/OfferEducational'

export const offerFactory = (
  offerExtend: Partial<CollectiveOffer>
): CollectiveOffer => ({
  id: 'OFFER_ID',
  isActive: true,
  status: OfferStatus.PENDING,
  isCancellable: true,
  venue: {
    id: 'VENUE_ID',
    name: 'venue name',
    publicName: 'venue name',
    departementCode: '75',
    fieldsUpdated: [],
    isValidated: true,
    isVirtual: false,
    managingOffererId: 'OFFERER_ID',
    managingOfferer: {
      city: 'Paris',
      dateCreated: new Date().toISOString(),
      id: 'OFFERER_ID',
      isActive: true,
      isValidated: true,
      name: 'offerer name',
      postalCode: '75000',
      thumbCount: 0,
    },
    thumbCount: 0,
  },
  isTemplate: false,
  name: 'Offre de test',
  bookingEmails: ['toto@example.com'],
  contactEmail: 'toto@example.com',
  contactPhone: '0600000000',
  dateCreated: new Date().toISOString(),
  description: 'blablabla,',
  domains: [{ id: 1, name: 'Danse' }],
  hasBookingLimitDatetimesPassed: false,
  interventionArea: ['mainland'],
  isEditable: true,
  nonHumanizedId: 123,
  offerVenue: {
    venueId: '',
    otherAddress: 'A la mairie',
    addressType: OfferAddressType.OTHER,
  },
  students: [StudentLevels.COLL_GE_3E],
  subcategoryId: SubcategoryIdEnum.CINE_PLEIN_AIR,
  venueId: 'VENUE_ID',
  isBookable: true,
  isVisibilityEditable: true,
  ...offerExtend,
})

export const collectiveOfferStockFactory = (
  stockExtend: Partial<GetCollectiveOfferCollectiveStockResponseModel>
): GetCollectiveOfferCollectiveStockResponseModel => ({
  id: 'STOCK_ID',
  isBooked: false,
  isCancellable: true,
  price: 10,
  ...stockExtend,
})

export const collectiveOfferTemplateFactory = (
  offerExtend: Partial<CollectiveOfferTemplate>
): CollectiveOfferTemplate => ({
  id: 'OFFER_ID',
  isActive: true,
  status: OfferStatus.ACTIVE,
  isCancellable: true,
  venue: {
    id: 'VENUE_ID',
    name: 'venue name',
    publicName: 'venue name',
    departementCode: '75',
    fieldsUpdated: [],
    isValidated: true,
    isVirtual: false,
    managingOffererId: 'OFFERER_ID',
    managingOfferer: {
      city: 'Paris',
      dateCreated: new Date().toISOString(),
      id: 'OFFERER_ID',
      isActive: true,
      isValidated: true,
      name: 'offerer name',
      postalCode: '75000',
      thumbCount: 0,
    },
    thumbCount: 0,
  },
  isTemplate: true,
  name: 'Offre de test',
  bookingEmails: ['toto@example.com'],
  contactEmail: 'toto@example.com',
  contactPhone: '0600000000',
  dateCreated: new Date().toISOString(),
  description: 'blablabla,',
  domains: [{ id: 1, name: 'Danse' }],
  hasBookingLimitDatetimesPassed: false,
  interventionArea: ['mainland'],
  isEditable: true,
  nonHumanizedId: 123,
  offerVenue: {
    venueId: '',
    otherAddress: 'A la mairie',
    addressType: OfferAddressType.OTHER,
  },
  students: [StudentLevels.COLL_GE_3E],
  subcategoryId: SubcategoryIdEnum.CINE_PLEIN_AIR,
  venueId: 'VENUE_ID',
  ...offerExtend,
})
