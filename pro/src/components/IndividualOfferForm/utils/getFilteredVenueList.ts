import { CATEGORY_STATUS } from 'core/Offers/constants'
import { OfferSubCategory } from 'core/Offers/types'
import { IndividualOfferVenueItem } from 'core/Venue/types'

export const getFilteredVenueListBySubcategory = (
  venueList: IndividualOfferVenueItem[],
  subcategory?: OfferSubCategory
): IndividualOfferVenueItem[] => {
  if (!subcategory) {
    return venueList
  }

  if (
    subcategory?.onlineOfflinePlatform === CATEGORY_STATUS.ONLINE_OR_OFFLINE
  ) {
    return venueList
  }

  return venueList.filter(venue =>
    subcategory.onlineOfflinePlatform === CATEGORY_STATUS.ONLINE
      ? venue.isVirtual
      : !venue.isVirtual
  )
}

export const getFilteredVenueListByCategoryStatus = (
  venueList: IndividualOfferVenueItem[],
  categoryStatus: CATEGORY_STATUS
): IndividualOfferVenueItem[] => {
  if (categoryStatus === CATEGORY_STATUS.ONLINE_OR_OFFLINE) {
    return venueList
  }

  return venueList.filter(venue =>
    categoryStatus === CATEGORY_STATUS.ONLINE
      ? venue.isVirtual
      : !venue.isVirtual
  )
}
