import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import * as router from 'react-router-dom'

import { OfferAddressType } from 'apiClient/adage'
import { apiAdage } from 'apiClient/api'
import { AdageUserContextProvider } from 'pages/AdageIframe/app/providers/AdageUserContext'
import { defaultAdageUser, defaultCollectiveOffer } from 'utils/adageFactories'
import { renderWithProviders } from 'utils/renderWithProviders'

import OfferCardComponent, { CardComponentProps } from '../OfferCard'

vi.mock('apiClient/api', () => ({
  apiAdage: {
    logConsultPlaylistElement: vi.fn(),
  },
}))

const mockOffer = {
  ...defaultCollectiveOffer,
  venue: {
    ...defaultCollectiveOffer.venue,
    distance: 5,
  },
  offerVenue: {
    ...defaultCollectiveOffer.offerVenue,
    distance: 10,
  },
  isTemplate: false,
}

const renderOfferCardComponent = ({
  offer,
  handlePlaylistElementTracking,
}: CardComponentProps) => {
  renderWithProviders(
    <AdageUserContextProvider adageUser={defaultAdageUser}>
      <OfferCardComponent
        offer={offer}
        handlePlaylistElementTracking={handlePlaylistElementTracking}
      />
    </AdageUserContextProvider>
  )
}

describe('OfferCard component', () => {
  it('should render school tag when offer will happens in school', () => {
    const offer = {
      ...mockOffer,
      offerVenue: {
        ...mockOffer.offerVenue,
        addressType: OfferAddressType.SCHOOL,
      },
    }
    renderOfferCardComponent({ offer, handlePlaylistElementTracking: vi.fn() })

    expect(screen.getByText('En classe')).toBeInTheDocument()
  })

  it('should render offer venue tag when offer will happens in pro venue', () => {
    const offer = {
      ...mockOffer,
      offerVenue: {
        ...mockOffer.offerVenue,
        addressType: OfferAddressType.OFFERER_VENUE,
      },
    }
    renderOfferCardComponent({ offer, handlePlaylistElementTracking: vi.fn() })

    expect(screen.getByText('Sortie')).toBeInTheDocument()
    expect(screen.getByText('À 10 km')).toBeInTheDocument()
  })

  it('should render other venue tag when offer will happens in other venue than pro one', () => {
    const offer = {
      ...mockOffer,
      offerVenue: {
        ...mockOffer.offerVenue,
        addressType: OfferAddressType.OTHER,
      },
    }
    renderOfferCardComponent({ offer, handlePlaylistElementTracking: vi.fn() })

    expect(screen.getByText('Sortie')).toBeInTheDocument()
    expect(screen.getByText('Lieu à définir')).toBeInTheDocument()
  })

  it('should redirect on click in offer card', async () => {
    vi.spyOn(router, 'useSearchParams').mockReturnValueOnce([
      new URLSearchParams({ token: '123' }),
      vi.fn(),
    ])

    renderOfferCardComponent({
      offer: mockOffer,
      handlePlaylistElementTracking: vi.fn(),
    })

    const offerElement = screen.getByTestId('card-offer-link')

    expect(offerElement).toHaveAttribute(
      'href',
      '/adage-iframe/decouverte/offre/479?token=123'
    )
  })

  it('should call tracking route on click in offer card', async () => {
    const mockhandlePlaylistElementTracking = vi.fn()
    vi.spyOn(apiAdage, 'logConsultPlaylistElement')

    renderOfferCardComponent({
      offer: mockOffer,
      handlePlaylistElementTracking: mockhandlePlaylistElementTracking,
    })

    const offerElement = screen.getByTestId('card-offer-link')

    offerElement.setAttribute('href', '')

    await userEvent.click(offerElement)

    expect(mockhandlePlaylistElementTracking).toHaveBeenCalledTimes(1)
  })
})