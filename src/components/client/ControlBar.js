import get from 'lodash.get'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import Price from './Price'
import Booking from './Booking'
import Icon from '../layout/Icon'
import selectBooking from '../../selectors/booking'
import selectCurrentOffer from '../../selectors/currentOffer'
import selectCurrentOfferer from '../../selectors/currentOfferer'
import selectCurrentRecommendation from '../../selectors/currentRecommendation'
import { requestData } from '../../reducers/data'
import { showModal } from '../../reducers/modal'

class ControlBar extends Component {
  onClickDisable = event => {
    alert('Pas encore disponible')
    event.preventDefault()
  }

  onClickFavorite(type) {
    this.props.requestData('POST', 'recommendations', {
      body: [
        {
          id: this.props.recommendation.id,
          isFavorite: true,
        },
      ],
      storeKey: 'recommendations'
    })
  }

  onClickShare() {
    // TODO
  }

  onClickJyVais = event => {
    if (this.props.offer) {
      this.props.showModal(<Booking />, {
        fullscreen: true,
        maskColor: 'transparent',
        hasCloseButton: false,
      })
    } else {
      alert("Ce bouton vous permet d'effectuer une reservation")
    }
  }

  render() {
    const { isFavorite, offer, offerer, booking } = this.props
    return (
      <ul className="control-bar">
        <li>
          <small className="pass-label">Mon Pass</small>
          <span className="pass-value">——€</span>
        </li>
        <li>
          <button
            className="button button--secondary disabled"
            onClick={this.onClickDisable}
          >
            <Icon svg={isFavorite ? 'ico-like-w' : 'ico-like-w'} />
          </button>
        </li>
        <li>
          <button
            className="button button--secondary disabled"
            onClick={this.onClickDisable}
          >
            <Icon svg="ico-share-w" />
          </button>
        </li>
        <li>
          {booking ? (
            <Link
              to="/reservations"
              className="button button--primary button--inversed button--go"
            >
              <Icon name="Check" />
              {' Réservé'}
            </Link>
          ) : (
            <button
              className="button button--primary button--go"
              onClick={this.onClickJyVais}
            >
              <Price
                value={get(offer, 'price') || get(offer, 'displayPrice')}
                free="——"
                className={offerer ? 'strike' : ''}
              />
              J'y vais!
            </button>
          )}
        </li>
      </ul>
    )
  }
}

export default connect(
  state => ({
    booking: selectBooking(state),
    recommendation: selectCurrentRecommendation(state),
    offer: selectCurrentOffer(state),
    offerer: selectCurrentOfferer(state),
  }),
  {
    requestData,
    showModal,
  }
)(ControlBar)
