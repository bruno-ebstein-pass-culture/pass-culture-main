import { generatePath } from 'react-router-dom'

import { OFFER_WIZARD_STEP_IDS } from 'components/IndividualOfferBreadcrumb'
import { OFFER_WIZARD_MODE } from 'core/Offers/constants'

import {
  getIndividualOfferUrlV2,
  getIndividualOfferPathV2,
} from './getIndividualOfferUrlV2'

interface GetIndividualOfferPathArgs {
  isCreation?: boolean
  mode: OFFER_WIZARD_MODE
  step: OFFER_WIZARD_STEP_IDS
  isV2?: boolean
}
export const getIndividualOfferPath = ({
  isCreation = false,
  mode,
  step,
  isV2 = false,
}: GetIndividualOfferPathArgs) => {
  // needed for redirection to old url
  if (isV2) {
    return getIndividualOfferPathV2({
      isCreation,
      mode,
      step,
    })
  }

  if (isCreation) {
    return `/offre/individuelle/creation/informations`
  }

  return {
    [OFFER_WIZARD_STEP_IDS.INFORMATIONS]: {
      [OFFER_WIZARD_MODE.CREATION]: `/offre/individuelle/:offerId/creation/informations`,
      [OFFER_WIZARD_MODE.DRAFT]: `/offre/individuelle/:offerId/brouillon/informations`,
      [OFFER_WIZARD_MODE.EDITION]: `/offre/individuelle/:offerId/informations`,
    },
    [OFFER_WIZARD_STEP_IDS.STOCKS]: {
      [OFFER_WIZARD_MODE.CREATION]: `/offre/individuelle/:offerId/creation/stocks`,
      [OFFER_WIZARD_MODE.DRAFT]: `/offre/individuelle/:offerId/brouillon/stocks`,
      [OFFER_WIZARD_MODE.EDITION]: `/offre/individuelle/:offerId/stocks`,
    },
    [OFFER_WIZARD_STEP_IDS.TARIFS]: {
      [OFFER_WIZARD_MODE.CREATION]: `/offre/individuelle/:offerId/creation/tarifs`,
      [OFFER_WIZARD_MODE.DRAFT]: `/offre/individuelle/:offerId/brouillon/tarifs`,
      [OFFER_WIZARD_MODE.EDITION]: `/offre/individuelle/:offerId/tarifs`,
    },
    [OFFER_WIZARD_STEP_IDS.SUMMARY]: {
      [OFFER_WIZARD_MODE.CREATION]: `/offre/individuelle/:offerId/creation/recapitulatif`,
      [OFFER_WIZARD_MODE.DRAFT]: `/offre/individuelle/:offerId/brouillon/recapitulatif`,
      [OFFER_WIZARD_MODE.EDITION]: `/offre/individuelle/:offerId/recapitulatif`,
    },
    [OFFER_WIZARD_STEP_IDS.CONFIRMATION]: {
      [OFFER_WIZARD_MODE.CREATION]: `/offre/individuelle/:offerId/creation/confirmation`,
      [OFFER_WIZARD_MODE.DRAFT]: `/offre/individuelle/:offerId/brouillon/confirmation`,
      [OFFER_WIZARD_MODE.EDITION]: '',
    },
  }[step][mode]
}

interface GetIndividualOfferUrlArgs {
  offerId?: number
  mode: OFFER_WIZARD_MODE
  step: OFFER_WIZARD_STEP_IDS
  isV2?: boolean
}
const getIndividualOfferUrl = ({
  offerId,
  mode,
  step,
  isV2 = false,
}: GetIndividualOfferUrlArgs) => {
  if (isV2) {
    return getIndividualOfferUrlV2({
      offerId,
      mode,
      step,
    })
  }

  return generatePath(
    getIndividualOfferPath({
      isCreation: offerId === undefined,
      mode,
      step,
    }),
    { offerId }
  )
}
export default getIndividualOfferUrl