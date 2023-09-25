import React from 'react'
import { useLocation } from 'react-router-dom'

import { BannerCreateOfferAdmin } from 'components/Banner'
import { useIndividualOfferContext } from 'context/IndividualOfferContext'
import { OFFER_WIZARD_MODE } from 'core/Offers/constants'
import { useOfferWizardMode } from 'hooks'
import useCurrentUser from 'hooks/useCurrentUser'
import {
  Informations as InformationsScreen,
  Template as WizardTemplate,
} from 'screens/IndividualOffer'
import { parse } from 'utils/query-string'

const Offer = (): JSX.Element | null => {
  const mode = useOfferWizardMode()
  const { currentUser } = useCurrentUser()
  const { offer } = useIndividualOfferContext()

  const { search } = useLocation()
  const { structure: offererId, lieu: venueId } = parse(search)

  const showAdminCreationBanner =
    currentUser.isAdmin &&
    mode === OFFER_WIZARD_MODE.CREATION &&
    !(offererId || offer)

  return (
    <WizardTemplate>
      {showAdminCreationBanner ? (
        <BannerCreateOfferAdmin />
      ) : (
        <InformationsScreen offererId={offererId} venueId={venueId} />
      )}
    </WizardTemplate>
  )
}

export default Offer