/*
 * @debt directory "Gaël: this file should be migrated within the new directory structure"
 * @debt deprecated "Gaël: deprecated usage of react-final-form"
 * @debt standard "Gaël: migration from classes components to function components"
 */

import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { Form } from 'react-final-form'
import LoadingInfiniteScroll from 'react-loading-infinite-scroller'
import { Link } from 'react-router-dom'

import Icon from 'components/layout/Icon'
import TextInput from 'components/layout/inputs/TextInput/TextInput'
import PageTitle from 'components/layout/PageTitle/PageTitle'
import Spinner from 'components/layout/Spinner'
import Titles from 'components/layout/Titles/Titles'
import { ReactComponent as AddOffererSvg } from 'icons/ico-plus.svg'
import { selectOfferers } from 'store/selectors/data/offerersSelectors'
import { UNAVAILABLE_ERROR_PAGE } from 'utils/routes'
import { mapApiToBrowser } from 'utils/translate'

import OffererItemContainer from './OffererItem/OffererItemContainer'
import PendingOffererItem from './OffererItem/PendingOffererItem'
import createVenueForOffererUrl from './utils/createVenueForOffererUrl'

/**
 * @debt standard "Annaëlle: Composant de classe à migrer en fonctionnel"
 */
class Offerers extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      hasMore: false,
      isLoading: false,
      keywordsInputValue: '',
    }
  }

  componentDidMount() {
    const { query } = this.props
    // We need to use this system because of this issue:
    // https://github.com/danbovey/react-infinite-scroller/issues/12#issuecomment-339375017
    this.forceRenderKey = 0

    const queryParams = query.parse()
    if (queryParams.page) {
      query.change({ page: null })
    } else {
      this.handleRequestData()
    }
  }

  componentDidUpdate(prevProps) {
    const { location } = this.props

    if (location.search !== prevProps.location.search) {
      this.handleRequestData()
    }
  }

  changeKeywordsValue = event => {
    this.setState({ keywordsInputValue: event.target.value })
  }

  handleRequestData = () => {
    const { loadOfferers } = this.props

    const handleSuccess = (state, action) => {
      const { payload } = action
      const { headers } = payload

      const nextOfferers = selectOfferers(state)
      const totalOfferersCount = parseInt(headers['total-data-count'], 10)
      const currentOfferersCount = nextOfferers.length

      this.setState({
        hasMore: currentOfferersCount < totalOfferersCount,
        isLoading: false,
      })
    }

    const handleFail = () => {
      this.setState({
        hasMore: false,
        isLoading: false,
      })
    }

    this.setState(
      { isLoading: true, hasMore: true },
      loadOfferers(handleSuccess, handleFail)
    )
  }

  handleOnKeywordsSubmit = () => {
    const { query, resetLoadedOfferers } = this.props
    const { keywordsInputValue } = this.state
    const keywords = keywordsInputValue
    const queryParams = query.parse()

    const isEmptyKeywords = typeof keywords === 'undefined' || keywords === ''

    query.change({
      [mapApiToBrowser.keywords]: isEmptyKeywords ? null : keywords,
      page: null,
    })
    this.forceRenderKey++ // See variable declaration for more information

    if (queryParams[mapApiToBrowser.keywords] !== keywords)
      resetLoadedOfferers()
  }

  renderForm = ({ handleSubmit }) => {
    const { keywordsInputValue } = this.state

    return (
      <form className="form-search" onSubmit={handleSubmit}>
        <TextInput
          label="Rechercher une structure :"
          name="keywords"
          onChange={this.changeKeywordsValue}
          placeholder="Saisissez un ou plusieurs mots complets"
          value={keywordsInputValue}
        />
        <button className="secondary-button" type="submit">
          OK
        </button>
      </form>
    )
  }

  onPageChange = page => {
    const { query } = this.props
    query.change({ page }, { historyMethod: 'replace' })
  }

  onPageReset = () => {
    const { query } = this.props
    query.change({ page: null })
  }

  render() {
    const { offerers, query, isOffererCreationAvailable } = this.props
    const queryParams = query.parse()
    const { hasMore, isLoading } = this.state

    const sectionTitle =
      offerers.length > 1 ? 'Structures juridiques' : 'Structure juridique'

    const initialValues = {
      keywords: queryParams[mapApiToBrowser.keywords],
    }

    const url = isOffererCreationAvailable
      ? createVenueForOffererUrl(offerers)
      : UNAVAILABLE_ERROR_PAGE

    const offererCreationPageURL = isOffererCreationAvailable
      ? '/structures/creation'
      : UNAVAILABLE_ERROR_PAGE

    const actionLink = (
      <span>
        <Link className="primary-button with-icon" to={offererCreationPageURL}>
          <AddOffererSvg />
          Ajouter une structure
        </Link>
        <Icon
          data-place="bottom"
          data-tip="<p>Ajouter les SIREN des structures que vous souhaitez gérer au global avec ce compte (par exemple, un réseau de grande distribution ou de franchisés).</p>"
          data-type="info"
          svg="picto-tip"
        />
      </span>
    )

    return (
      <div className="offerers-page">
        <PageTitle title="Vos structures juridiques" />
        <Titles action={actionLink} title={sectionTitle} />
        <p className="advice">
          Pour présenter vos offres, vous devez d’abord{' '}
          <a href={url}>créer un nouveau lieu</a> lié à une structure.
          <br />
          Sans lieu, vous pouvez uniquement ajouter des offres numériques.
        </p>

        <Form
          initialValues={initialValues}
          onSubmit={this.handleOnKeywordsSubmit}
          render={this.renderForm}
        />

        <br />

        <LoadingInfiniteScroll
          className="main-list offerers-list"
          element="ul"
          handlePageChange={this.onPageChange}
          handlePageReset={this.onPageReset}
          hasMore={hasMore}
          isLoading={isLoading}
          key={this.forceRenderKey} // See variable declaration for more information
          loader={<Spinner key="spinner" />}
        >
          {offerers.map(offerer => {
            return offerer.isValidated && offerer.userHasAccess ? (
              <OffererItemContainer key={offerer.id} offerer={offerer} />
            ) : (
              <PendingOffererItem key={offerer.siren} offerer={offerer} />
            )
          })}
        </LoadingInfiniteScroll>
        {hasMore === false && 'Fin des résultats'}
      </div>
    )
  }
}

Offerers.propTypes = {
  isOffererCreationAvailable: PropTypes.bool.isRequired,
  loadOfferers: PropTypes.func.isRequired,
  location: PropTypes.shape().isRequired,
  offerers: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  query: PropTypes.shape().isRequired,
  resetLoadedOfferers: PropTypes.func.isRequired,
}

export default Offerers
