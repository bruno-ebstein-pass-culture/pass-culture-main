import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { api } from 'apiClient/api'
import { Events } from 'core/FirebaseEvents/constants'
import * as useAnalytics from 'hooks/useAnalytics'
import { renderWithProviders } from 'utils/renderWithProviders'

import Header from '../Header'

const mockLogEvent = vi.fn()
vi.mock('apiClient/api', () => ({
  api: { signout: vi.fn(), listOfferersNames: vi.fn() },
}))

const defaultStore = {
  user: {
    currentUser: {
      isAdmin: false,
      email: 'test@toto.com',
    },
    initialized: true,
  },
}

const renderHeader = (storeOverrides = defaultStore) =>
  renderWithProviders(<Header />, {
    storeOverrides,
    initialRouterEntries: ['/accueil'],
  })

describe('navigation menu', () => {
  describe('when clicking on Home icon', () => {
    it('should redirect to /accueil when user is not admin', () => {
      // When
      renderHeader()

      // Then
      expect(screen.getByText('Accueil').closest('a')).toHaveAttribute(
        'href',
        '/accueil'
      )
    })
  })

  describe('trackers should have been called 1 time with pathname', () => {
    beforeEach(() => {
      vi.spyOn(useAnalytics, 'default').mockImplementation(() => ({
        logEvent: mockLogEvent,
        setLogEvent: vi.fn(),
      }))
    })

    it('when clicking on Pro', async () => {
      // given
      renderHeader()

      // When
      await userEvent.click(
        screen.getByRole('img', {
          name: "Pass Culture pro, l'espace des acteurs culturels",
        })
      )

      // Then
      expect(mockLogEvent).toHaveBeenCalledTimes(1)
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, Events.CLICKED_PRO, {
        from: '/accueil',
      })
    })

    it('when clicking on Home', async () => {
      // given
      renderHeader()

      // When
      await userEvent.click(screen.getByText('Accueil'))

      // Then
      expect(mockLogEvent).toHaveBeenCalledTimes(1)
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, Events.CLICKED_HOME, {
        from: '/accueil',
      })
    })

    it('when clicking on Ticket', async () => {
      // given
      renderHeader()

      // When
      await userEvent.click(screen.getByText('Guichet'))

      // Then
      expect(mockLogEvent).toHaveBeenCalledTimes(1)
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, Events.CLICKED_TICKET, {
        from: '/accueil',
      })
    })

    it('when clicking on Offers', async () => {
      // given
      renderHeader()

      // When
      await userEvent.click(screen.getByText('Offres'))

      // Then
      expect(mockLogEvent).toHaveBeenCalledTimes(1)
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, Events.CLICKED_OFFER, {
        from: '/accueil',
      })
    })

    it('when clicking on Bookings', async () => {
      // given
      renderHeader()

      // When
      await userEvent.click(screen.getByText('Réservations'))

      // Then
      expect(mockLogEvent).toHaveBeenCalledTimes(1)
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, Events.CLICKED_BOOKING, {
        from: '/accueil',
      })
    })

    it('when clicking on Reimbursement', async () => {
      // given
      renderHeader()

      // When
      await userEvent.click(screen.getByText('Remboursements'))

      // Then
      expect(mockLogEvent).toHaveBeenCalledTimes(1)
      expect(mockLogEvent).toHaveBeenNthCalledWith(
        1,
        Events.CLICKED_REIMBURSEMENT,
        { from: '/accueil' }
      )
    })

    it('when clicking on Stats', async () => {
      // given
      const overrideStore = {
        ...defaultStore,
        features: {
          list: [{ isActive: true, nameKey: 'ENABLE_OFFERER_STATS' }],
        },
      }
      vi.spyOn(api, 'listOfferersNames').mockResolvedValue({
        offerersNames: [{ id: 123, name: 'AE' }],
      })

      renderHeader(overrideStore)

      // When
      await userEvent.click(screen.getAllByRole('menuitem')[5])

      // Then
      expect(mockLogEvent).toHaveBeenCalledTimes(1)
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, Events.CLICKED_STATS, {
        from: '/accueil',
      })
    })

    it('when clicking on Logout', async () => {
      // given
      renderHeader()
      vi.spyOn(api, 'signout').mockResolvedValue()

      // When
      await userEvent.click(screen.getAllByRole('menuitem')[5])

      // Then
      expect(mockLogEvent).toHaveBeenCalledTimes(1)
      expect(mockLogEvent).toHaveBeenNthCalledWith(1, Events.CLICKED_LOGOUT, {
        from: '/accueil',
      })
    })
  })
})