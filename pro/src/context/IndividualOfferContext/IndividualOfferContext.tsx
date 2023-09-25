import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { OffererName } from 'core/Offerers/types'
import { getIndividualOfferAdapter } from 'core/Offers/adapters'
import {
  OfferCategory,
  IndividualOffer,
  OfferSubCategory,
} from 'core/Offers/types'
import { GET_DATA_ERROR_MESSAGE } from 'core/shared'
import { IndividualOfferVenue } from 'core/Venue/types'
import useNotification from 'hooks/useNotification'
import Spinner from 'ui-kit/Spinner/Spinner'

import { getWizardData } from './adapters'

export interface IndividualOfferContextValues {
  offerId: number | null
  offer: IndividualOffer | null
  setOffer: ((offer: IndividualOffer | null) => void) | null
  categories: OfferCategory[]
  subCategories: OfferSubCategory[]
  subcategory?: OfferSubCategory
  setSubcategory: (p?: OfferSubCategory) => void
  offererNames: OffererName[]
  venueList: IndividualOfferVenue[]
  shouldTrack: boolean
  setShouldTrack: (p: boolean) => void
  venueId?: number | undefined
  offerOfferer?: OffererName | null
  showVenuePopin: Record<string, boolean>
}

export const IndividualOfferContext =
  createContext<IndividualOfferContextValues>({
    offerId: null,
    offer: null,
    setOffer: null,
    categories: [],
    subCategories: [],
    offererNames: [],
    venueList: [],
    shouldTrack: true,
    setShouldTrack: () => {},
    showVenuePopin: {},
    setSubcategory: () => {},
  })

export const useIndividualOfferContext = () => {
  return useContext(IndividualOfferContext)
}

interface IndividualOfferContextProviderProps {
  children: React.ReactNode
  isUserAdmin: boolean
  offerId?: string
  queryOffererId?: string
  querySubcategoryId?: string
}

export function IndividualOfferContextProvider({
  children,
  isUserAdmin,
  offerId,
  queryOffererId,
  querySubcategoryId,
}: IndividualOfferContextProviderProps) {
  const homePath = '/accueil'
  const notify = useNotification()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [shouldTrack, setShouldTrack] = useState<boolean>(true)
  const [offerOfferer, setOfferOfferer] = useState<OffererName | null>(null)
  const [venueId, setVenueId] = useState<number>()

  const [offer, setOfferState] = useState<IndividualOffer | null>(null)
  const [categories, setCategories] = useState<OfferCategory[]>([])
  const [subCategories, setSubCategories] = useState<OfferSubCategory[]>([])
  const [subcategory, setSubcategory] = useState<OfferSubCategory>()
  const [offererNames, setOffererNames] = useState<OffererName[]>([])
  const [venueList, setVenueList] = useState<IndividualOfferVenue[]>([])
  const [showVenuePopin, setShowVenuePopin] = useState<Record<string, boolean>>(
    {}
  )

  const setOffer = (offer: IndividualOffer | null) => {
    setOfferState(offer)
    setOfferOfferer(
      offer
        ? {
            id: offer.venue.offerer.id,
            name: offer.venue.offerer.name,
          }
        : null
    )
  }

  useEffect(() => {
    async function loadOffer() {
      const response = await getIndividualOfferAdapter(Number(offerId))
      if (response.isOk) {
        setOffer(response.payload)
        setVenueId(response.payload.venueId)
      } else {
        navigate(homePath)
        notify.error(
          'Une erreur est survenue lors de la récupération de votre offre'
        )
      }
    }
    offerId ? loadOffer() : setOffer(null)
  }, [offerId])

  useEffect(() => {
    async function loadData() {
      const response = await getWizardData({
        offerer: offerOfferer || undefined,
        queryOffererId,
        isAdmin: isUserAdmin,
      })

      if (response.isOk) {
        setCategories(response.payload.categoriesData.categories)
        setSubCategories(response.payload.categoriesData.subCategories)
        setOffererNames(response.payload.offererNames)
        setVenueList(response.payload.venueList)
        const venuesPopinDisplaying: Record<string, boolean> = {}
        response.payload.venueList.forEach(v => {
          venuesPopinDisplaying[v.id] =
            !v.hasCreatedOffer && v.hasMissingReimbursementPoint
        })
        setShowVenuePopin(venuesPopinDisplaying)
        setSubcategory(
          response.payload.categoriesData.subCategories.find(
            s => s.id === querySubcategoryId
          )
        )
      } else {
        setCategories([])
        setSubCategories([])
        setOffererNames([])
        setVenueList([])
        navigate(homePath)
        notify.error(GET_DATA_ERROR_MESSAGE)
      }
      setIsLoading(false)
    }
    if (!offerId || offer !== null) {
      loadData()
    }
  }, [offerId, offerOfferer])

  if (isLoading === true) {
    return <Spinner />
  }

  return (
    <IndividualOfferContext.Provider
      value={{
        offerId: offer?.id || null,
        offer,
        setOffer,
        categories,
        subCategories,
        offererNames,
        venueList,
        shouldTrack,
        setShouldTrack,
        venueId,
        offerOfferer,
        showVenuePopin: showVenuePopin,
        subcategory,
        setSubcategory,
      }}
    >
      {children}
    </IndividualOfferContext.Provider>
  )
}