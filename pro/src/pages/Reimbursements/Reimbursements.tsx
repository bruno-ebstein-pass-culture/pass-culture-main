import './Reimbursement.scss'

import React from 'react'
import { Route, Routes } from 'react-router-dom'

import { routesReimbursements } from 'app/AppRouter/subroutesReimbursements'
import { BannerReimbursementsInfo } from 'components/Banner'
import AddBankAccountCallout from 'components/Callout/AddBankAccountCallout'
import LinkVenueCallout from 'components/Callout/LinkVenueCallout'
import PendingBankAccountCallout from 'components/Callout/PendingBankAccountCallout'
import { ReimbursementsBreadcrumb } from 'components/ReimbursementsBreadcrumb'
import Titles from 'ui-kit/Titles/Titles'

const Reimbursements = (): JSX.Element => {
  return (
    <>
      <Titles title="Remboursements" />

      <>
        {/* TODO: displaying condition when offerer is available here. (Done in another branch)*/}
        <AddBankAccountCallout titleOnly={true} />
        {/* TODO: displaying condition when offerer is available here. (Done in another branch)*/}
        <LinkVenueCallout titleOnly={true} />
        {/* TODO: displaying condition when offerer is available here. (Done in another branch)*/}
        <PendingBankAccountCallout titleOnly={true} />

        <BannerReimbursementsInfo />

        <ReimbursementsBreadcrumb />

        <Routes>
          {routesReimbursements.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </>
    </>
  )
}

export default Reimbursements
