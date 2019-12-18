import React from 'react'
import {mount, shallow} from 'enzyme'

import TiteliveProviderForm from '../TiteliveProviderForm'
import {Form} from 'react-final-form'

describe('src | components | pages | Venue | VenueProvidersManager | form | TiteliveProviderForm', () => {
  let createVenueProvider
  let props
  let notify
  let history

  beforeEach(() => {
    createVenueProvider = jest.fn()
    history = {
      push: jest.fn(),
    }
    notify = jest.fn()
    props = {
      createVenueProvider,
      history,
      notify,
      offererId: 'CC',
      providerId: 'CC',
      venueId: 'AA',
      venueIdAtOfferProviderIsRequired: false,
      venueSiret: '12345678901234'
    }
  })

  it('should match the snapshot', () => {
    // when
    const wrapper = shallow(<TiteliveProviderForm {...props} />)

    // then
    expect(wrapper).toMatchSnapshot()
  })

  it('should initialize TiteliveProviderForm component with default state', () => {
    // when
    const wrapper = shallow(<TiteliveProviderForm {...props} />)

    // then
    expect(wrapper.state()).toStrictEqual({
      isLoadingMode: false,
    })
  })

  describe('when not in loading mode', () => {
    it('should display an import button', () => {
      // when
      const wrapper = mount(<TiteliveProviderForm {...props} />)

      // then
      const importButtonContainer = wrapper.find('.provider-import-button-container')
      expect(importButtonContainer).toHaveLength(1)
      const importButton = importButtonContainer.find('button')
      expect(importButton).toHaveLength(1)
      expect(importButton.prop('className')).toBe('button is-intermediate provider-import-button')
      expect(importButton.prop('type')).toBe('submit')
      expect(importButton.text()).toBe('Importer')
    })

    it('should render the title of the section compte', () => {
      // when
      const wrapper = mount(<TiteliveProviderForm {...props} />)

      // then
      const form = wrapper.find(Form)
      expect(form).toHaveLength(1)
      const label = form.find('.account-label')
      expect(label.text()).toBe('Compte')
    })

    it('should display the venue siret as provider identifier', () => {
      // when
      const wrapper = mount(<TiteliveProviderForm {...props} />)

      // then
      const form = wrapper.find(Form)
      expect(form).toHaveLength(1)
      const textField = form.find('.account-value')
      expect(textField).toHaveLength(1)
      expect(textField.text()).toBe('12345678901234')
    })
  })

  describe('handleSubmit', () => {
    it('should update venue provider using API', () => {
      // given
      const formValues = {
        preventDefault: jest.fn(),
      }
      const wrapper = shallow(<TiteliveProviderForm {...props} />)

      // when
      wrapper.instance().handleFormSubmit(formValues, {})

      // then
      expect(wrapper.state('isLoadingMode')).toBe(true)
      expect(createVenueProvider).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
        providerId: 'CC',
        venueId: 'AA',
        venueIdAtOfferProvider: '12345678901234',
      })
    })
  })

  describe('handleSuccess', () => {
    it('should update current url when action was handled successfully', () => {
      // given
      const wrapper = shallow(<TiteliveProviderForm {...props} />)

      // when
      wrapper.instance().handleSuccess()

      // then
      expect(history.push).toHaveBeenCalledWith('/structures/CC/lieux/AA')
    })
  })

  describe('handleFail', () => {
    it('should display a notification with the proper informations', () => {
      // given
      const wrapper = shallow(<TiteliveProviderForm {...props} />)
      const action = {
        payload: {
          errors: [
            {
              error: 'fake error',
            },
          ],
        },
      }
      const form = {
        batch: jest.fn(),
      }
      // when
      wrapper.instance().handleFail(form)({}, action)
      // then
      expect(notify).toHaveBeenCalledWith([{ error: 'fake error' }])
    })
  })
})
