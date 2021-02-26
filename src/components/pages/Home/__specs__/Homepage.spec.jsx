import '@testing-library/jest-dom'
import { act, render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'

import * as pcapi from 'repository/pcapi/pcapi'
import { configureTestStore } from 'store/testUtils'

import Homepage from '../Homepage'

jest.mock('utils/config', () => ({
  DEMARCHES_SIMPLIFIEES_OFFERER_RIB_UPLOAD_PROCEDURE_URL:
    'link/to/offerer/demarchesSimplifiees/procedure',
}))

jest.mock('repository/pcapi/pcapi', () => ({
  getOfferer: jest.fn(),
  getAllOfferersNames: jest.fn(),
  getVenueStats: jest.fn(),
  updateUserInformations: jest.fn().mockResolvedValue({}),
}))

const renderHomePage = async () => {
  const store = configureTestStore({
    data: {
      users: [
        {
          id: 'fake_id',
          firstName: 'John',
          lastName: 'Do',
          email: 'john.do@dummy.xyz',
          phoneNumber: '01 00 00 00 00',
        },
      ],
    },
  })
  return await act(async () => {
    await render(
      <Provider store={store}>
        <MemoryRouter>
          <Homepage />
        </MemoryRouter>
      </Provider>
    )
  })
}

describe('homepage', () => {
  let baseOfferers
  let baseOfferersNames

  beforeEach(() => {
    baseOfferers = [
      {
        address: 'LA COULÉE D’OR',
        city: 'Cayenne',
        name: 'Bar des amis',
        id: 'GE',
        postalCode: '97300',
        siren: '111111111',
        bic: 'test bic 01',
        iban: 'test iban 01',
        managedVenues: [
          {
            id: 'test_venue_id_1',
            isVirtual: true,
            managingOffererId: 'GE',
            name: 'Le Sous-sol (Offre numérique)',
            offererName: 'Bar des amis',
            publicName: null,
            nOffers: 2,
          },
          {
            id: 'test_venue_id_2',
            isVirtual: false,
            managingOffererId: 'GE',
            name: 'Le Sous-sol (Offre physique)',
            offererName: 'Bar des amis',
            publicName: null,
            nOffers: 2,
          },
          {
            id: 'test_venue_id_3',
            isVirtual: false,
            managingOffererId: 'GE',
            name: 'Le deuxième Sous-sol (Offre physique)',
            offererName: 'Bar des amis',
            publicName: 'Le deuxième Sous-sol',
            nOffers: 2,
          },
        ],
      },
      {
        address: 'RUE DE NIEUPORT',
        city: 'Drancy',
        id: 'FQ',
        name: 'Club Dorothy',
        postalCode: '93700',
        siren: '222222222',
        bic: 'test bic 02',
        iban: 'test iban 02',
        managedVenues: [],
      },
    ]
    baseOfferersNames = baseOfferers.map(offerer => ({
      id: offerer.id,
      name: offerer.name,
    }))

    pcapi.getOfferer.mockResolvedValue(baseOfferers[0])
    pcapi.getAllOfferersNames.mockResolvedValue(baseOfferersNames)
    pcapi.getVenueStats.mockResolvedValue({
      activeBookingsQuantity: 4,
      usedBookingsQuantity: 3,
    })
  })

  afterEach(() => {
    pcapi.getOfferer.mockClear()
    pcapi.getAllOfferersNames.mockClear()
  })

  describe('render', () => {
    beforeEach(async () => {
      await renderHomePage()
    })

    describe('profileAndSupport', () => {
      it('should display section and subsection titles', () => {
        expect(screen.getByText('Profil et aide', { selector: 'h2' })).toBeInTheDocument()
        expect(screen.getByText('Profil')).toBeInTheDocument()
        expect(screen.getByText('Aide et support')).toBeInTheDocument()
        expect(screen.getByText('Modalités d’usage', { selector: 'h2' })).toBeInTheDocument()
      })

      it('should display help links', () => {
        const contactLink = screen.getByText('Contacter le support', { selector: 'a' })
        const cguLink = screen.getByText('Conditions Générales d’Utilisation', {
          selector: 'a',
        })
        const faqLink = screen.getByText('Foire Aux Questions', { selector: 'a' })

        expect(contactLink).toBeInTheDocument()
        expect(cguLink).toBeInTheDocument()
        expect(faqLink).toBeInTheDocument()

        expect(contactLink.getAttribute('href')).toBe('mailto:support@passculture.app')
        expect(cguLink.getAttribute('href')).toBe('https://pass.culture.fr/cgu-professionnels/')
        expect(faqLink.getAttribute('href')).toBe(
          'https://aide.passculture.app/fr/category/acteurs-culturels-1t20dhs/'
        )
      })

      describe('update profile informations modal', () => {
        it('should display profile modifications modal when clicking on modify button', async () => {
          // when
          fireEvent.click(screen.getByText('Modifier', { selector: 'button' }))

          // then
          expect(await screen.findByLabelText('Nom')).toBeInTheDocument()
          expect(await screen.findByLabelText('Prénom')).toBeInTheDocument()
          expect(await screen.findByLabelText('Email')).toBeInTheDocument()
          expect(await screen.findByLabelText('Téléphone')).toBeInTheDocument()
        })

        it('should close the modal when clicking on cancel button', async () => {
          // given
          fireEvent.click(screen.getByText('Modifier', { selector: 'button' }))

          // when
          fireEvent.click(screen.getByText('Annuler', { selector: 'button' }))

          // then
          expect(await screen.queryByLabelText('Nom')).not.toBeInTheDocument()
        })

        it('should update user info on submit', async () => {
          // given
          fireEvent.click(screen.getByText('Modifier', { selector: 'button' }))
          fireEvent.change(screen.getByLabelText('Prénom'), {
            target: { value: 'Johnny' },
          })
          fireEvent.change(screen.getByLabelText('Nom'), {
            target: { value: 'Doe' },
          })
          fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'johnny.doe@dummy.xyz' },
          })
          fireEvent.change(screen.getByLabelText('Téléphone'), {
            target: { value: '01 01 00 00 00' },
          })

          // when
          await act(async () => {
            await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
          })

          // then
          expect(pcapi.updateUserInformations).toHaveBeenCalledWith({
            firstName: 'Johnny',
            lastName: 'Doe',
            email: 'johnny.doe@dummy.xyz',
            phoneNumber: '01 01 00 00 00',
          })
        })

        it('should show errors on submit', async () => {
          // given
          pcapi.updateUserInformations.mockRejectedValue({
            errors: { firstName: ['Prénom en erreur'], email: ['Email en erreur'] },
          })
          fireEvent.click(screen.getByText('Modifier', { selector: 'button' }))
          fireEvent.change(screen.getByLabelText('Prénom'), {
            target: { value: 'Johnny' },
          })
          fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'johnny.doe@dummy.xyz' },
          })

          // when
          await act(async () => {
            await fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
          })

          // then
          expect(screen.getByText('Prénom en erreur')).toBeInTheDocument()
          expect(screen.getByText('Email en erreur')).toBeInTheDocument()
        })
      })
    })
  })
})
