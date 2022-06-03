import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { QueryCache, QueryClient, QueryClientProvider } from 'react-query'

import '@fontsource/barlow'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow/300.css'
import { api } from 'api/api'
import { AdageFrontRoles } from 'api/gen'
import { UnauthenticatedError } from 'app/components/UnauthenticatedError/UnauthenticatedError'
import * as pcapi from 'repository/pcapi/pcapi'

import { AppLayout } from './AppLayout'
import {
  Notification,
  NotificationComponent,
  NotificationType,
} from './components/Layout/Notification/Notification'
import { LoaderPage } from './components/LoaderPage/LoaderPage'
import { VenueFilterType } from './types/offers'

export const queryCache = new QueryCache()
export const queryClient = new QueryClient({
  queryCache,
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
})

export const App = (): JSX.Element => {
  const [userRole, setUserRole] = useState<AdageFrontRoles | null>()
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [venueFilter, setVenueFilter] = useState<VenueFilterType | null>(null)
  const [notification, setNotification] = useState<Notification | null>(null)

  useEffect(() => {
    api
      .getAdageIframeAuthenticate()
      .then(({ role: userRole }) => setUserRole(userRole))
      .then(() => {
        const params = new URLSearchParams(window.location.search)
        const siret = params.get('siret')
        const venueId = params.get('venue')
        if (siret) {
          return pcapi
            .getVenueBySiret(siret)
            .then(venueFilter => setVenueFilter(venueFilter))
            .catch(() =>
              setNotification(
                new Notification(
                  NotificationType.error,
                  'Lieu inconnu. Tous les résultats sont affichés.'
                )
              )
            )
        }

        if (venueId) {
          return pcapi
            .getVenueById(venueId)
            .then(venueFilter => setVenueFilter(venueFilter))
            .catch(() =>
              setNotification(
                new Notification(
                  NotificationType.error,
                  'Lieu inconnu. Tous les résultats sont affichés.'
                )
              )
            )
        }
      })
      .catch(() => setUserRole(null))
      .finally(() => setIsLoading(false))
  }, [])

  const removeVenueFilter = useCallback(() => setVenueFilter(null), [])

  if (isLoading) {
    return <LoaderPage />
  }

  return (
    <QueryClientProvider client={queryClient}>
      {notification && <NotificationComponent notification={notification} />}
      {userRole &&
        [AdageFrontRoles.Readonly, AdageFrontRoles.Redactor].includes(
          userRole
        ) && (
          <AppLayout
            removeVenueFilter={removeVenueFilter}
            userRole={userRole}
            venueFilter={venueFilter}
          />
        )}
      {userRole === null && <UnauthenticatedError />}
    </QueryClientProvider>
  )
}
