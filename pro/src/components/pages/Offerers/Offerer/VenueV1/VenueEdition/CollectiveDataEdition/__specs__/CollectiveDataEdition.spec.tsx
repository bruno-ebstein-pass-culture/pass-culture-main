import '@testing-library/jest-dom'

import * as pcapi from 'repository/pcapi/pcapi'
import * as useNotification from 'components/hooks/useNotification'

import { ApiError, GetVenueResponseModel } from 'apiClient/v1'
import { domtomOptions, mainlandOptions } from 'core/Venue'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ApiRequestOptions } from 'apiClient/v1/core/ApiRequestOptions'
import { ApiResult } from 'apiClient/v1/core/ApiResult'
import CollectiveDataEdition from '../CollectiveDataEdition'
import { GET_DATA_ERROR_MESSAGE } from 'core/shared'
import type { History } from 'history'
import { Provider } from 'react-redux'
import React from 'react'
import { Router } from 'react-router'
import { api } from 'apiClient/api'
import { configureTestStore } from 'store/testUtils'
import { createBrowserHistory } from 'history'
import userEvent from '@testing-library/user-event'

jest.mock('repository/pcapi/pcapi', () => ({
  getEducationalDomains: jest.fn(),
}))

jest.mock('apiClient/api', () => ({
  api: {
    getVenuesEducationalStatuses: jest.fn(),
    getEducationalPartners: jest.fn(),
    editVenue: jest.fn(),
    getVenueCollectiveData: jest.fn(),
  },
}))

const mockHistoryPush = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    offererId: 'O1',
    venueId: 'V1',
  }),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}))

jest.mock('components/hooks/useNotification')

const waitForLoader = () =>
  waitFor(() => {
    expect(screen.getByLabelText(/E-mail/)).toBeInTheDocument()
  })

const renderCollectiveDataEdition = (history: History) =>
  render(
    <Router history={history}>
      <Provider store={configureTestStore({})}>
        <CollectiveDataEdition />
      </Provider>
    </Router>
  )

describe('CollectiveDataEdition', () => {
  const history = createBrowserHistory()
  const notifyErrorMock = jest.fn()
  const notifySuccessMock = jest.fn()

  beforeAll(() => {
    jest.spyOn(api, 'getVenuesEducationalStatuses').mockResolvedValue({
      statuses: [
        {
          id: 1,
          name: 'statut 1',
        },
        {
          id: 2,
          name: 'statut 2',
        },
      ],
    })
    jest.spyOn(pcapi, 'getEducationalDomains').mockResolvedValue([
      { id: 1, name: 'domain 1' },
      { id: 2, name: 'domain 2' },
    ])
    jest
      .spyOn(api, 'getEducationalPartners')
      .mockResolvedValue({ partners: [] })
    jest
      .spyOn(api, 'editVenue')
      .mockResolvedValue({ id: 'A1' } as GetVenueResponseModel)

    jest.spyOn(useNotification, 'default').mockImplementation(() => ({
      success: notifySuccessMock,
      error: notifyErrorMock,
      information: jest.fn(),
      pending: jest.fn(),
      close: jest.fn(),
    }))

    jest.spyOn(api, 'getVenueCollectiveData').mockResolvedValue({
      id: 'A1',
      collectiveDomains: [],
      collectiveDescription: '',
      collectiveEmail: '',
      collectiveInterventionArea: [],
      collectiveLegalStatus: null,
      collectiveNetwork: [],
      collectivePhone: '',
      collectiveStudents: [],
      collectiveWebsite: '',
    })
  })

  describe('render', () => {
    it('should render a loader while data is loading', async () => {
      renderCollectiveDataEdition(history)

      expect(screen.getByText(/Chargement en cours/)).toBeInTheDocument()
    })

    it('should render form without errors', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const descriptionField = screen.queryByLabelText(
        'Démarche d’éducation artistique et culturelle',
        { exact: false }
      )
      const studentsField = screen.getByLabelText(/Public cible/)
      const websiteField = screen.getByLabelText(/URL de votre site web/)
      const phoneField = screen.getByLabelText(/Téléphone/)
      const emailField = screen.getByLabelText(/E-mail/)
      const domainsField = screen.getByLabelText(
        /Domaine artistique et culturel :/
      )
      const interventionAreaField = screen.getByLabelText(
        /Périmètre d’intervention :/
      )
      const statusField = screen.getByLabelText(/Statut :/)
      const culturalPartnersField = screen.getByLabelText(
        /Réseaux partenaires EAC :/
      )

      expect(descriptionField).toBeInTheDocument()
      expect(studentsField).toBeInTheDocument()
      expect(websiteField).toBeInTheDocument()
      expect(phoneField).toBeInTheDocument()
      expect(emailField).toBeInTheDocument()
      expect(domainsField).toBeInTheDocument()
      expect(interventionAreaField).toBeInTheDocument()
      expect(statusField).toBeInTheDocument()
      expect(culturalPartnersField).toBeInTheDocument()
    })

    it('should display toaster when some data could not be loaded', async () => {
      jest
        .spyOn(api, 'getVenuesEducationalStatuses')
        .mockRejectedValueOnce(
          new ApiError(
            {} as ApiRequestOptions,
            { status: 500 } as ApiResult,
            ''
          )
        )

      renderCollectiveDataEdition(history)

      await waitFor(() => {
        expect(notifyErrorMock).toHaveBeenCalledWith(GET_DATA_ERROR_MESSAGE)
      })
    })

    it('should display popin when user is leaving page without saving', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const phoneField = screen.getByLabelText(/Téléphone/)
      await userEvent.type(phoneField, '0612345678')

      history.push('/')
      await waitFor(() =>
        expect(
          screen.getByText(
            'Voulez vous quitter la page d’informations pour les enseignants ?'
          )
        ).toBeInTheDocument()
      )
    })
  })

  describe('error fields', () => {
    it('should display error fields', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const websiteField = screen.getByLabelText(/URL de votre site web/)
      const phoneField = screen.getByLabelText(/Téléphone/)
      const emailField = screen.getByLabelText(/E-mail/)
      const title = screen.getByText('Présentation pour les enseignants')

      await userEvent.type(websiteField, 'wrong url')
      await userEvent.type(phoneField, 'not a valid phone')
      await userEvent.type(emailField, 'not a valid email')

      await userEvent.click(title)

      expect(
        screen.queryByText('Votre numéro de téléphone n’est pas valide')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('l’URL renseignée n’est pas valide')
      ).toBeInTheDocument()
      expect(
        screen.queryByText('Votre email n’est pas valide')
      ).toBeInTheDocument()
    })

    it('should not display error fields when fields are valid', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const websiteField = screen.getByLabelText(/URL de votre site web/)
      const phoneField = screen.getByLabelText(/Téléphone/)
      const emailField = screen.getByLabelText(/E-mail/)
      const title = screen.getByText('Présentation pour les enseignants')

      await userEvent.type(websiteField, 'https://mon-site.com')
      await userEvent.type(phoneField, '0600000000')
      await userEvent.type(emailField, 'email@domain.com')

      fireEvent.click(title)

      await waitFor(() =>
        expect(
          screen.queryByText('Votre email n’est pas valide')
        ).not.toBeInTheDocument()
      )
      expect(
        screen.queryByText('Votre numéro de téléphone n’est pas valide')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('l’URL renseignée n’est pas valide')
      ).not.toBeInTheDocument()
    })

    it('should not display error fields when fields are empty', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const websiteField = screen.getByLabelText(/URL de votre site web/)
      const phoneField = screen.getByLabelText(/Téléphone/)
      const emailField = screen.getByLabelText(/E-mail/)
      const title = screen.getByText('Présentation pour les enseignants')

      fireEvent.click(websiteField)
      fireEvent.click(phoneField)
      fireEvent.click(emailField)
      fireEvent.click(title)

      await waitFor(() =>
        expect(
          screen.queryByText('Votre email n’est pas valide')
        ).not.toBeInTheDocument()
      )
      expect(
        screen.queryByText('Votre numéro de téléphone n’est pas valide')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('l’URL renseignée n’est pas valide')
      ).not.toBeInTheDocument()
    })
  })

  describe('intervention area', () => {
    it('should select all departments when clicking on "Toute la France"', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const interventionAreaField = screen.getByLabelText(
        /Périmètre d’intervention :/
      )
      await userEvent.click(interventionAreaField)
      await waitFor(() =>
        expect(
          screen.queryByText(/France métropolitaine et d’outre-mer/)
        ).toBeInTheDocument()
      )
      const allDepartmentsOption = screen.getByLabelText(
        /France métropolitaine et d’outre-mer/
      )
      await userEvent.click(allDepartmentsOption)
      ;[...mainlandOptions, ...domtomOptions].forEach(option => {
        expect(screen.getByLabelText(option.label)).toBeChecked()
      })
    })

    it('should select all mainland departments when clicking on "France métropolitaine"', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const interventionAreaField = screen.getByLabelText(
        /Périmètre d’intervention :/
      )
      await userEvent.click(interventionAreaField)
      await waitFor(() =>
        expect(screen.queryByText('France métropolitaine')).toBeInTheDocument()
      )
      const mainlandOption = screen.getByLabelText('France métropolitaine')
      await userEvent.click(mainlandOption)
      ;[...mainlandOptions].forEach(option => {
        expect(screen.getByLabelText(option.label)).toBeChecked()
      })
    })

    it('should select only domtom options after selecting "Toute la France" then unselecting "France métropolitaine"', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const interventionAreaField = screen.getByLabelText(
        /Périmètre d’intervention :/
      )
      await userEvent.click(interventionAreaField)
      await waitFor(() =>
        expect(screen.queryByText('France métropolitaine')).toBeInTheDocument()
      )

      await userEvent.click(
        screen.getByLabelText(/France métropolitaine et d’outre-mer/)
      )
      await userEvent.click(screen.getByLabelText('France métropolitaine'))
      expect(
        screen.queryByLabelText(mainlandOptions[0].label)
      ).not.toBeChecked()
      domtomOptions.forEach(option =>
        expect(screen.queryByLabelText(option.label)).toBeChecked()
      )
    })

    it('should select (unselect) "Toute la France" and "France métropolitaine" when selecting (unselecting) all (one) departments', async () => {
      renderCollectiveDataEdition(history)

      await waitForLoader()

      const interventionAreaField = screen.getByLabelText(
        /Périmètre d’intervention :/
      )
      await userEvent.click(interventionAreaField)
      await waitFor(() =>
        expect(screen.queryByText('France métropolitaine')).toBeInTheDocument()
      )

      // check all mainland options
      await Promise.all(
        mainlandOptions.map(option => {
          userEvent.click(screen.getByLabelText(option.label))
        })
      )
      await waitFor(() => {
        const mainlandOption = screen.getByLabelText('France métropolitaine')
        expect(mainlandOption).toBeChecked()
      })

      // check all other departments
      await Promise.all(
        domtomOptions.map(option => {
          userEvent.click(screen.getByLabelText(option.label))
        })
      )
      await waitFor(() => {
        const allFranceOption = screen.getByLabelText(
          /France métropolitaine et d’outre-mer/
        )
        expect(allFranceOption).toBeChecked()
      })

      // unselect dom tom department
      await userEvent.click(screen.getByLabelText(domtomOptions[0].label))
      await waitFor(() =>
        expect(
          screen.getByLabelText(/France métropolitaine et d’outre-mer/)
        ).not.toBeChecked()
      )

      await userEvent.click(screen.getByLabelText(mainlandOptions[0].label))
      await waitFor(() =>
        expect(screen.getByLabelText('France métropolitaine')).not.toBeChecked()
      )
    })
  })

  describe('submit', () => {
    it('should display error toast when adapter call failed', async () => {
      jest
        .spyOn(api, 'editVenue')
        .mockRejectedValueOnce(
          new ApiError(
            {} as ApiRequestOptions,
            { status: 500 } as ApiResult,
            ''
          )
        )
      renderCollectiveDataEdition(history)
      await waitForLoader()

      const emailField = screen.getByLabelText(/E-mail/)
      await userEvent.type(emailField, 'email@domain.com')

      const submitButton = screen.getByRole('button', { name: 'Enregistrer' })
      await userEvent.click(submitButton)

      await waitFor(() =>
        expect(notifyErrorMock).toHaveBeenCalledWith(
          'Une erreur est surevenue lors de l’enregistrement des données'
        )
      )
    })
  })

  it('shoud redirect to venue edition page with state', async () => {
    renderCollectiveDataEdition(history)
    await waitForLoader()

    const emailField = screen.getByLabelText(/E-mail/)
    await userEvent.type(emailField, 'email@domain.com')

    const submitButton = screen.getByRole('button', { name: 'Enregistrer' })
    await userEvent.click(submitButton)

    expect(mockHistoryPush).toHaveBeenCalledWith({
      pathname: '/structures/O1/lieux/V1',
      state: {
        collectiveDataEditionSuccess:
          'Vos informations ont bien été enregistrées',
      },
    })
  })

  it('should prefill form with venue collective data', async () => {
    jest.spyOn(api, 'getVenueCollectiveData').mockResolvedValue({
      id: 'A1',
      collectiveDomains: [{ id: 1, name: 'domain 1' }],
      collectiveDescription: '',
      collectiveEmail: 'toto@domain.com',
      collectiveInterventionArea: [],
      collectiveLegalStatus: { id: 1, name: 'statut 1' },
      collectiveNetwork: [],
      collectivePhone: '',
      collectiveStudents: [],
      collectiveWebsite: '',
    })

    renderCollectiveDataEdition(history)

    await waitForLoader()

    const emailField = screen.getByLabelText(/E-mail/)

    const statusField = screen.getByLabelText(/Statut :/)

    expect(emailField).toHaveValue('toto@domain.com')
    expect(statusField).toHaveValue('1')

    await userEvent.click(
      await screen.findByLabelText(/Domaine artistique et culturel :/)
    )
    await waitFor(async () =>
      expect(
        await screen.findAllByRole('checkbox', { checked: true })
      ).toHaveLength(1)
    )
  })
})
