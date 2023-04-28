import {
  CollectiveOfferTemplateResponseModel,
  OfferAddressType,
} from 'apiClient/adage'

export const defaultCollectiveTemplateOffer: CollectiveOfferTemplateResponseModel =
  {
    audioDisabilityCompliant: false,
    visualDisabilityCompliant: false,
    mentalDisabilityCompliant: true,
    motorDisabilityCompliant: true,
    contactEmail: 'test@example.com',
    domains: [],
    id: 1,
    interventionArea: [],
    isExpired: false,
    isSoldOut: false,
    name: 'Mon offre vitrine',
    offerVenue: {
      venueId: 'VENUE_ID',
      otherAddress: '',
      addressType: OfferAddressType.OFFERER_VENUE,
    },
    students: [],
    subcategoryLabel: 'Cinéma',
    venue: {
      id: 1,
      address: '1 boulevard Poissonnière',
      city: 'Paris',
      name: 'Mon lieu',
      postalCode: '75000',
      publicName: 'Mon lieu nom publique',
      managingOfferer: {
        name: 'Ma super structure',
      },
      coordinates: {
        latitude: 48.87004,
        longitude: 2.3785,
      },
    },
  }
