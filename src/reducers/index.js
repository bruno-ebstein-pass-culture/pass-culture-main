import { form, loading, modal, user } from 'pass-culture-shared'
import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import data from './data'
import geolocation from './geolocation'
import queries from './queries'
import verso from './verso'
import splash from './splash'

const rootReducer = combineReducers({
  data,
  form,
  geolocation,
  loading,
  modal,
  queries,
  splash,
  verso,
  user,
  router: routerReducer,
})

export default rootReducer
