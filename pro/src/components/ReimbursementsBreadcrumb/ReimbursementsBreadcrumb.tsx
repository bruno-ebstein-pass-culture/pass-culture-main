import React from 'react'

import Breadcrumb, { BreadcrumbStyle } from 'components/Breadcrumb'
import useActiveFeature from 'hooks/useActiveFeature'
import useActiveStep from 'hooks/useActiveStep'

import {
  STEP_LIST,
  STEP_NAMES,
  OLD_STEP_LIST,
  OLD_STEP_NAMES,
  STEP_ID_BANK_INFORMATIONS,
} from './constants'

const ReimbursementsBreadcrumb = () => {
  const isNewBankDetailsJourneyEnable = useActiveFeature(
    'WIP_ENABLE_NEW_BANK_DETAILS_JOURNEY'
  )
  const activeStep = useActiveStep(
    isNewBankDetailsJourneyEnable ? STEP_NAMES : OLD_STEP_NAMES
  )

  const getSteps = () => {
    // TODO: add condition
    const hasBannerError = true
    if (hasBannerError) {
      const indexBankInformationStep = STEP_LIST.findIndex(
        value => value.id === STEP_ID_BANK_INFORMATIONS
      )

      STEP_LIST[indexBankInformationStep].hasWarning = true
    }
    return STEP_LIST
  }

  return (
    <Breadcrumb
      activeStep={activeStep}
      steps={isNewBankDetailsJourneyEnable ? getSteps() : OLD_STEP_LIST}
      styleType={BreadcrumbStyle.TAB}
    />
  )
}

export default ReimbursementsBreadcrumb
