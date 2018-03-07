import React from 'react'

import ClientOfferPage from '../pages/ClientOfferPage'
import DiscoveryPage from '../pages/DiscoveryPage'
import InventoryPage from '../pages/InventoryPage'
import HomePage from '../pages/HomePage'
import OffererPage from '../pages/OffererPage'
import ProfessionalPage from '../pages/ProfessionalPage'
import ProfilePage from '../pages/ProfilePage'
import SignPage from '../pages/SignPage'

const routes = [
  {
    exact: true,
    path: '/',
    render: () => <HomePage />
  },
  {
    exact: true,
    path: '/decouverte',
    render: () => <DiscoveryPage />
  },
  {
    exact: true,
    path: '/decouverte/:offerId/:mediationId?',
    render: props => <ClientOfferPage offerId={props.match.params.offerId}
                                     mediationId={props.match.params.mediationId} />
  },
  {
    exact: true,
    path: '/pro',
    render: () => <ProfessionalPage />
  },
  {
    exact: true,
    path:'/pro/:offererId',
    render: props => <OffererPage offererId={props.match.params.offererId} />
  },
  {
    exact: true,
    path: '/inscription',
    render: () => <SignPage />
  },
  {
    exact: true,
    path: '/inventaire',
    render: () => <InventoryPage />
  },
  {
    exact: true,
    path: '/profile',
    render: () => <ProfilePage />
  }
]

export default routes
