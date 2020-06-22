import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import BeneficiaryCell from './CellsFormatter/BeneficiaryCell'
import BookingDateCell from './CellsFormatter/BookingDateCell'
import BookingStatusCell from './CellsFormatter/BookingStatusCell'
import BookingTokenCell from './CellsFormatter/BookingTokenCell'
import BookingOfferCell from './CellsFormatter/BookingOfferCell'
import Header from './Header/Header'
import BookingIsDuoCell from './CellsFormatter/BookingIsDuoCell'
import { NB_BOOKINGS_PER_PAGE } from './NB_BOOKINGS_PER_PAGE'
import TableFrame from './Table/TableFrame'
import Filters, { ALL_VENUES, EMPTY_FILTER_VALUE } from './Filters/Filters'
import NoFilteredBookings from './NoFilteredBookings/NoFilteredBookings'
import findOldestBookingDate from './utils/findOldestBookingDate'
import filterBookingsRecap from './utils/filterBookingsRecap'

const FIRST_PAGE_INDEX = 0

class BookingsRecapTable extends Component {
  constructor(props) {
    super(props)
    this.state = {
      bookingsRecapFiltered: props.bookingsRecap,
      columns: [
        {
          id: 1,
          headerTitle: "Nom de l'offre",
          accessor: 'stock',
          Cell: ({ value }) => <BookingOfferCell offer={value} />,
          className: 'td-offer-name',
          defaultCanSort: true,
          sortType: (firstRow, secondRow) => {
            const offerNameOne = firstRow.original.stock.offer_name
            const offerNameTwo = secondRow.original.stock.offer_name
            return offerNameOne < offerNameTwo ? -1 : 1
          }
        },
        {
          id: 2,
          headerTitle: '',
          accessor: 'booking_is_duo',
          Cell: ({ value }) => <BookingIsDuoCell isDuo={value} />,
          className: 'td-booking-duo',
          disableSortBy: true
        },
        {
          id: 3,
          headerTitle: 'Bénéficiaire',
          accessor: 'beneficiary',
          Cell: ({ value }) => <BeneficiaryCell beneficiaryInfos={value} />,
          className: 'td-beneficiary',
          disableSortBy: true
        },
        {
          id: 4,
          headerTitle: 'Réservation',
          accessor: 'booking_date',
          Cell: ({ value }) => <BookingDateCell bookingDate={value} />,
          className: 'td-booking-date',
          disableSortBy: true
        },
        {
          id: 5,
          headerTitle: 'Contremarque',
          accessor: 'booking_token',
          Cell: ({ value }) => <BookingTokenCell bookingToken={value} />,
          className: 'td-booking-token',
          disableSortBy: true
        },
        {
          id: 6,
          headerTitle: 'Statut',
          Cell: ({ row }) => <BookingStatusCell bookingRecapInfo={row} />,
          className: 'td-booking-status',
          disableSortBy: true
        },
      ],
      currentPage: FIRST_PAGE_INDEX,
      filters: {
        bookingBeneficiary: EMPTY_FILTER_VALUE,
        bookingBeginningDate: EMPTY_FILTER_VALUE,
        bookingEndingDate: EMPTY_FILTER_VALUE,
        bookingToken: EMPTY_FILTER_VALUE,
        offerDate: EMPTY_FILTER_VALUE,
        offerISBN: EMPTY_FILTER_VALUE,
        offerName: EMPTY_FILTER_VALUE,
        offerVenue: ALL_VENUES,
      },
      oldestBookingDate: findOldestBookingDate(props.bookingsRecap),
    }
    this.filtersRef = React.createRef()
  }

  shouldComponentUpdate() {
    return true
  }

  componentDidUpdate(prevProps) {
    const { bookingsRecap } = this.props
    if (prevProps.bookingsRecap.length !== bookingsRecap.length) {
      this.applyFilters()
      this.setOldestBookingDate(bookingsRecap)
    }
  }

  setOldestBookingDate = bookingsRecap => {
    this.setState({
      oldestBookingDate: findOldestBookingDate(bookingsRecap),
    })
  }

  updateCurrentPage = currentPage => {
    this.setState({
      currentPage: currentPage,
    })
  }

  setFilters = filters => {
    this.setState({ filters: filters }, () => this.applyFilters())
  }

  applyFilters = () => {
    const { bookingsRecap } = this.props
    const { filters } = this.state
    const bookingsRecapFiltered = filterBookingsRecap(bookingsRecap, filters)

    this.setState({
      bookingsRecapFiltered: bookingsRecapFiltered,
      currentPage: FIRST_PAGE_INDEX
    })
  }

  resetFilters = () => {
    this.filtersRef.current.resetAllFilters()
  }

  render() {
    const { isLoading } = this.props
    const { bookingsRecapFiltered, columns, currentPage, oldestBookingDate } = this.state
    const nbBookings = bookingsRecapFiltered.length

    return (
      <div>
        <Filters
          isLoading={isLoading}
          oldestBookingDate={oldestBookingDate}
          ref={this.filtersRef}
          setFilters={this.setFilters}
        />
        {nbBookings > 0 ? (
          <Fragment>
            <Header
              bookingsRecapFiltered={bookingsRecapFiltered}
              isLoading={isLoading}
            />
            <TableFrame
              columns={columns}
              currentPage={currentPage}
              data={bookingsRecapFiltered}
              nbBookings={nbBookings}
              nbBookingsPerPage={NB_BOOKINGS_PER_PAGE}
              updateCurrentPage={this.updateCurrentPage}
            />
          </Fragment>
        ) : (
          <NoFilteredBookings resetFilters={this.resetFilters} />
        )}
      </div>
    )
  }
}

BookingsRecapTable.propTypes = {
  bookingsRecap: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  isLoading: PropTypes.bool.isRequired,
}

export default BookingsRecapTable
