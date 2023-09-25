import { screen, waitFor } from '@testing-library/react'

import {
  AdageFrontRoles,
  AuthenticatedResponse,
  CollectiveOfferTemplateResponseModel,
} from 'apiClient/adage'
import { apiAdage } from 'apiClient/api'
import { AdageUserContextProvider } from 'pages/AdageIframe/app/providers/AdageUserContext'
import { defaultCollectiveTemplateOffer } from 'utils/adageFactories'
import { renderWithProviders } from 'utils/renderWithProviders'

import { OffersFavorites } from '../OffersFavorites'

const mockOffer: CollectiveOfferTemplateResponseModel = {
  ...defaultCollectiveTemplateOffer,
}

const renderAdageFavoritesOffers = (
  user: AuthenticatedResponse,
  storeOverrides?: any
) => {
  renderWithProviders(
    <AdageUserContextProvider adageUser={user}>
      <OffersFavorites></OffersFavorites>
    </AdageUserContextProvider>,
    { storeOverrides }
  )
}

const isFavoritesActive = {
  features: {
    list: [
      {
        nameKey: 'WIP_ENABLE_LIKE_IN_ADAGE',
        isActive: true,
      },
    ],
    initialized: true,
  },
}

describe('OffersFavorites', () => {
  const user = {
    role: AdageFrontRoles.REDACTOR,
    uai: 'uai',
    departmentCode: '30',
    institutionName: 'COLLEGE BELLEVUE',
    institutionCity: 'ALES',
  }

  it('should render favorites title', async () => {
    renderAdageFavoritesOffers(user, isFavoritesActive)

    const loadingMessage = screen.queryByText(/Chargement en cours/)
    await waitFor(() => expect(loadingMessage).not.toBeInTheDocument())

    expect(
      screen.getByRole('heading', { name: 'Mes Favoris' })
    ).toBeInTheDocument()
  })

  it('should display no results message whenever favorites list is empty', async () => {
    renderAdageFavoritesOffers(user, isFavoritesActive)

    const loadingMessage = screen.queryByText(/Chargement en cours/)
    await waitFor(() => expect(loadingMessage).not.toBeInTheDocument())

    expect(
      screen.getByText('Aucune offre en favoris pour le moment.')
    ).toBeInTheDocument()
  })

  it('should display the list of favorites', async () => {
    vi.spyOn(apiAdage, 'getCollectiveFavorites').mockResolvedValueOnce({
      favoritesOffer: [],
      favoritesTemplate: [mockOffer],
    })

    renderAdageFavoritesOffers(user, isFavoritesActive)

    const loadingMessage = screen.queryByText(/Chargement en cours/)
    await waitFor(() => expect(loadingMessage).not.toBeInTheDocument())

    const listItemsInOffer = await screen.findAllByTestId('offer-listitem')

    expect(listItemsInOffer).toHaveLength(1)
  })

  it('should not display the list of favorites if the favorite cannot be fetched', async () => {
    vi.spyOn(apiAdage, 'getCollectiveFavorites').mockRejectedValueOnce({})

    renderAdageFavoritesOffers(user, isFavoritesActive)

    const loadingMessage = screen.queryByText(/Chargement en cours/)
    await waitFor(() => expect(loadingMessage).not.toBeInTheDocument())

    expect(
      screen.getByText('Aucune offre en favoris pour le moment.')
    ).toBeInTheDocument()
  })
})