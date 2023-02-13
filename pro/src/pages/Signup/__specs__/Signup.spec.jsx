import { screen } from '@testing-library/react'
import React from 'react'

import { api } from 'apiClient/api'
import { campaignTracker } from 'tracking/mediaCampaignsTracking'
import { renderWithProviders } from 'utils/renderWithProviders'

import Signup from '../Signup'

jest.mock('tracking/mediaCampaignsTracking')

jest.mock('apiClient/api', () => ({
  api: {
    getProfile: jest.fn().mockResolvedValue({}),
    listFeatures: jest.fn(),
  },
}))

describe('src | components | pages | Signup', () => {
  let storeOverrides
  beforeEach(() => {
    storeOverrides = {
      user: {
        currentUser: null,
      },
      features: {
        list: [{ isActive: true, nameKey: 'ENABLE_PRO_ACCOUNT_CREATION' }],
      },
    }
    api.listFeatures.mockResolvedValue([])
  })
  afterEach(jest.resetAllMocks)

  it('should render logo and sign-up form', () => {
    // given
    const props = {
      location: {
        pathname: '/inscription',
      },
    }

    // when
    renderWithProviders(<Signup {...props} />, { storeOverrides })

    // then
    expect(
      screen.getByRole('heading', { name: /Créer votre compte professionnel/ })
    ).toBeInTheDocument()
  })

  it('should render logo and confirmation page', () => {
    // given
    const props = {
      location: {
        pathname: '/inscription/confirmation',
      },
    }

    // when
    renderWithProviders(<Signup {...props} />, { storeOverrides })

    // then
    expect(
      screen.getByText(/Votre compte est en cours de création./)
    ).toBeInTheDocument()
  })

  it('should render maintenance page when signup is unavailable', async () => {
    // given
    const props = {
      location: {
        pathname: '/inscription',
      },
    }
    const storeOverrides = {
      features: {
        list: [{ isActive: false, nameKey: 'ENABLE_PRO_ACCOUNT_CREATION' }],
      },
    }

    // when
    renderWithProviders(<Signup {...props} />, { storeOverrides })

    // then
    expect(
      screen.getByRole('heading', { name: /Inscription indisponible/ })
    ).toBeInTheDocument()
  })

  it('should call media campaign tracker on mount only', async () => {
    // given
    api.listFeatures.mockResolvedValue([
      {
        isActive: true,
        nameKey: 'ENABLE_PRO_ACCOUNT_CREATION',
      },
    ])
    const props = {
      location: {},
    }

    // when
    const { rerender } = renderWithProviders(<Signup {...props} />, {
      storeOverrides,
    })

    // when rerender
    rerender(<Signup {...props} />)

    // then
    expect(campaignTracker.signUp).toHaveBeenCalledTimes(1)
  })
})
