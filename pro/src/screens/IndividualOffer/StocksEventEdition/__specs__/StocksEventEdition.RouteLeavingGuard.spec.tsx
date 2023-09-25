import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import format from 'date-fns/format'
import React from 'react'
import { Route, Routes } from 'react-router-dom'

import { api } from 'apiClient/api'
import {
  GetIndividualOfferResponseModel,
  StockResponseModel,
} from 'apiClient/v1'
import { OFFER_WIZARD_STEP_IDS } from 'components/IndividualOfferBreadcrumb'
import Notification from 'components/Notification/Notification'
import {
  IndividualOfferContext,
  IndividualOfferContextValues,
} from 'context/IndividualOfferContext'
import { Events } from 'core/FirebaseEvents/constants'
import { OFFER_WIZARD_MODE } from 'core/Offers/constants'
import { IndividualOffer, IndividualOfferVenue } from 'core/Offers/types'
import { getIndividualOfferPath } from 'core/Offers/utils/getIndividualOfferUrl'
import * as useAnalytics from 'hooks/useAnalytics'
import { ButtonLink } from 'ui-kit'
import { FORMAT_ISO_DATE_ONLY } from 'utils/date'
import { renderWithProviders } from 'utils/renderWithProviders'

import StocksEventEdition, {
  StocksEventEditionProps,
} from '../StocksEventEdition'

const mockLogEvent = vi.fn()

vi.mock('screens/IndividualOffer/Informations/utils', () => {
  return {
    filterCategories: vi.fn(),
  }
})

vi.mock('repository/pcapi/pcapi', () => ({
  postThumbnail: vi.fn(),
}))

vi.mock('utils/date', async () => {
  return {
    ...((await vi.importActual('utils/date')) ?? {}),
    getToday: vi.fn(() => new Date('2020-12-15T12:00:00Z')),
  }
})

const renderStockEventScreen = (
  props: StocksEventEditionProps,
  contextValue: IndividualOfferContextValues,
  url: string = getIndividualOfferPath({
    step: OFFER_WIZARD_STEP_IDS.STOCKS,
    mode: OFFER_WIZARD_MODE.EDITION,
  })
) =>
  renderWithProviders(
    <>
      <Routes>
        {Object.values(OFFER_WIZARD_MODE).map(mode => (
          <Route
            key={mode}
            path={getIndividualOfferPath({
              step: OFFER_WIZARD_STEP_IDS.STOCKS,
              mode,
            })}
            element={
              <IndividualOfferContext.Provider value={contextValue}>
                <StocksEventEdition {...props} />
                <ButtonLink link={{ to: '/outside', isExternal: false }}>
                  Go outside !
                </ButtonLink>
              </IndividualOfferContext.Provider>
            }
          />
        ))}
        <Route
          path={getIndividualOfferPath({
            step: OFFER_WIZARD_STEP_IDS.SUMMARY,
            mode: OFFER_WIZARD_MODE.CREATION,
          })}
          element={<div>Next page</div>}
        />
        <Route
          path={getIndividualOfferPath({
            step: OFFER_WIZARD_STEP_IDS.STOCKS,
            mode: OFFER_WIZARD_MODE.CREATION,
          })}
          element={<div>Save draft page</div>}
        />
        <Route
          path={getIndividualOfferPath({
            step: OFFER_WIZARD_STEP_IDS.INFORMATIONS,
            mode: OFFER_WIZARD_MODE.CREATION,
          })}
          element={<div>Previous page</div>}
        />
        <Route
          path="/outside"
          element={<div>This is outside stock form</div>}
        />
      </Routes>
      <Notification />
    </>,
    { initialRouterEntries: [url] }
  )

const priceCategoryId = '1'

describe('screens:StocksEventEdition', () => {
  let props: StocksEventEditionProps
  let contextValue: IndividualOfferContextValues
  let offer: Partial<IndividualOffer>
  const offerId = 1

  beforeEach(() => {
    offer = {
      id: offerId,
      venue: {
        departmentCode: '75',
      } as IndividualOfferVenue,
      stocks: [],
      priceCategories: [
        { id: Number(priceCategoryId), label: 'Cat 1', price: 10 },
        { id: 2, label: 'Cat 2', price: 20 },
      ],
    }
    props = {
      offer: offer as IndividualOffer,
    }
    contextValue = {
      offerId: null,
      offer: null,
      venueList: [],
      offererNames: [],
      categories: [],
      subCategories: [],
      setOffer: () => {},
      setShouldTrack: () => {},
      setSubcategory: () => {},
      shouldTrack: false,
      showVenuePopin: {},
    }
    vi.spyOn(api, 'getOffer').mockResolvedValue(
      {} as GetIndividualOfferResponseModel
    )

    vi.spyOn(useAnalytics, 'default').mockImplementation(() => ({
      logEvent: mockLogEvent,
      setLogEvent: null,
    }))
  })

  it('should not block when going outside and form is not touched', async () => {
    vi.spyOn(api, 'upsertStocks').mockResolvedValue({
      stocks: [{ id: 1 } as StockResponseModel],
    })

    renderStockEventScreen(props, contextValue)

    await userEvent.click(screen.getByText('Go outside !'))

    expect(screen.getByText('This is outside stock form')).toBeInTheDocument()
  })

  it('should be able to quit without submitting from RouteLeavingGuard', async () => {
    vi.spyOn(api, 'upsertStocks').mockResolvedValue({
      stocks: [{ id: 1 } as StockResponseModel],
    })

    renderStockEventScreen(props, contextValue)
    await userEvent.selectOptions(
      screen.getByLabelText('Tarif'),
      priceCategoryId
    )

    await userEvent.click(screen.getByText('Go outside !'))
    expect(
      screen.getByText(
        'Restez sur la page et cliquez sur “Enregistrer les modifications” pour ne rien perdre de vos modifications.'
      )
    ).toBeInTheDocument()
    await userEvent.click(screen.getByText('Quitter la page'))

    expect(api.upsertStocks).toHaveBeenCalledTimes(0)
    expect(screen.getByText('This is outside stock form')).toBeInTheDocument()
  })

  it('should track when quitting without submit from RouteLeavingGuard', async () => {
    vi.spyOn(api, 'upsertStocks').mockResolvedValue({
      stocks: [{ id: 1 } as StockResponseModel],
    })

    renderStockEventScreen(props, contextValue)

    await userEvent.type(
      screen.getByLabelText('Date'),
      format(new Date(), FORMAT_ISO_DATE_ONLY)
    )
    await userEvent.type(screen.getByLabelText('Horaire'), '12:00')
    await userEvent.selectOptions(
      screen.getByLabelText('Tarif'),
      priceCategoryId
    )

    await userEvent.click(screen.getByText('Go outside !'))

    await userEvent.click(screen.getByText('Quitter la page'))

    expect(mockLogEvent).toHaveBeenCalledTimes(1)
    expect(mockLogEvent).toHaveBeenNthCalledWith(
      1,
      Events.CLICKED_OFFER_FORM_NAVIGATION,
      {
        from: 'stocks',
        isDraft: false,
        isEdition: true,
        offerId: offerId,
        to: '/outside',
        used: 'RouteLeavingGuard',
      }
    )
  })
})