import React from 'react'

import LeavingGuardDialog from 'new_components/LeavingGuardDialog'
import RouteLeavingGuard, {
  IShouldBlockNavigationReturnValue,
} from 'new_components/RouteLeavingGuard'

export interface RouteLeavingGuardOfferCreationProps {
  isFormDirty: boolean
}

const RouteLeavingGuardVenueCollectiveDataEdition = ({
  isFormDirty,
}: RouteLeavingGuardOfferCreationProps): JSX.Element => {
  const shouldBlockNavigation = (): IShouldBlockNavigationReturnValue => ({
    shouldBlock: isFormDirty,
  })

  return (
    <RouteLeavingGuard
      labelledBy="LEAVING_VENUE_COLLECTIVE_DATA_EDITION_LABEL_ID"
      shouldBlockNavigation={shouldBlockNavigation}
      when
    >
      <LeavingGuardDialog
        title="Voulez vous quitter la page d’informations pour les enseignants ?"
        message="Vos informations ne seront pas sauvegardées et toutes les informations seront perdues."
      />
    </RouteLeavingGuard>
  )
}

export default RouteLeavingGuardVenueCollectiveDataEdition
