import { format } from 'date-fns-tz'
import PropTypes from 'prop-types'
import React from 'react'

import useActiveFeature from 'components/hooks/useActiveFeature'
import { useOfferEditionURL } from 'components/hooks/useOfferEditionURL'
import { FORMAT_DD_MM_YYYY_HH_mm, toDateStrippedOfTimezone } from 'utils/date'

const BookingOfferCell = ({ offer }) => {
  const useSummaryPage = useActiveFeature('OFFER_FORM_SUMMARY_PAGE')
  const editionUrl = useOfferEditionURL(
    offer.offer_is_educational,
    offer.offer_identifier,
    useSummaryPage
  )
  const eventBeginningDatetime = offer.event_beginning_datetime
  const isbn = offer.offer_isbn

  const eventDatetimeFormatted = eventBeginningDatetime
    ? format(
        toDateStrippedOfTimezone(eventBeginningDatetime),
        FORMAT_DD_MM_YYYY_HH_mm
      )
    : null

  return (
    <a
      href={editionUrl}
      rel="noopener noreferrer"
      target="_blank"
      title={`${offer.offer_name} (ouverture dans un nouvel onglet)`}
    >
      <div className="booking-offer-name">{offer.offer_name}</div>
      {isbn ||
        (eventBeginningDatetime && (
          <div className="booking-offer-additional-info">
            {eventDatetimeFormatted || isbn}
          </div>
        ))}
    </a>
  )
}

BookingOfferCell.defaultValues = {
  offer: {
    event_beginning_datetime: null,
    offer_isbn: null,
  },
}

BookingOfferCell.propTypes = {
  offer: PropTypes.shape({
    event_beginning_datetime: PropTypes.string,
    offer_isbn: PropTypes.string,
    offer_identifier: PropTypes.string.isRequired,
    offer_name: PropTypes.string.isRequired,
    offer_is_educational: PropTypes.bool.isRequired,
  }).isRequired,
}

export default BookingOfferCell
