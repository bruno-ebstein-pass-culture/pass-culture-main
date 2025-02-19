import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { string } from 'yup'

import { urlRegex } from 'core/shared'

export const validatePhone = phone => {
  if (!phone) {
    return
  }
  const phoneNumber = parsePhoneNumberFromString(phone, 'FR')
  const isValid = phoneNumber?.isValid()
  if (!isValid) {
    return 'Votre numéro de téléphone n’est pas valide'
  }
}

export const validateEmail = async val => {
  const isValid = await string().email().isValid(val)
  if (val === null) {
    return
  }
  if (!isValid) {
    return 'Votre email n’est pas valide'
  }
}

export const validateUrl = async url => {
  if (!url) {
    return
  }
  if (!urlRegex.test(url)) {
    return 'L’URL renseignée n’est pas valide'
  }
}
