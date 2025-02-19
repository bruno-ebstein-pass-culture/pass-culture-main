import React from 'react'

import { WithdrawalTypeEnum } from 'apiClient/v1'
import useAnalytics from 'components/hooks/useAnalytics'
import {
  Events,
  OFFER_FORM_NAVIGATION_MEDIUM,
} from 'core/FirebaseEvents/constants'
import { OFFER_WITHDRAWAL_TYPE_LABELS } from 'core/Offers'
import { AccessiblityEnum, IAccessibiltyFormValues } from 'core/shared'
import { OfferBreadcrumbStep } from 'new_components/OfferBreadcrumb'
import { SummaryLayout } from 'new_components/SummaryLayout'
import { AccessibilityLabel } from 'ui-kit'

import styles from './OfferSummary.module.scss'
import humanizeDelay from './utils'

export interface IOfferSectionProps {
  id: string
  nonHumanizedId: number
  name: string
  description: string
  categoryName: string
  subCategoryName: string
  subcategoryId: string

  musicTypeName?: string
  musicSubTypeName?: string
  showTypeName?: string
  showSubTypeName?: string

  accessibility: IAccessibiltyFormValues

  isDuo: boolean
  author: string
  stageDirector: string
  speaker: string
  visa: string
  performer: string
  isbn: string
  durationMinutes: string
  url: string

  venueName: string
  venuePublicName: string
  isVenueVirtual: boolean
  offererName: string
  bookingEmail: string
  withdrawalDetails: string
  withdrawalType: WithdrawalTypeEnum | null
  withdrawalDelay: number | null
}

interface IOfferSummaryProps {
  offer: IOfferSectionProps
  isCreation: boolean
  conditionalFields: string[]
}

const OfferSummary = ({
  isCreation,
  offer,
  conditionalFields,
}: IOfferSummaryProps): JSX.Element => {
  const editLink = isCreation
    ? `/offre/${offer.id}/individuel/creation`
    : `/offre/${offer.id}/individuel/edition`
  const { logEvent } = useAnalytics()
  const logEditEvent = () => {
    logEvent?.(Events.CLICKED_OFFER_FORM_NAVIGATION, {
      from: OfferBreadcrumbStep.SUMMARY,
      to: OfferBreadcrumbStep.DETAILS,
      used: OFFER_FORM_NAVIGATION_MEDIUM.RECAP_LINK,
      isEdition: !isCreation,
    })
  }

  return (
    <SummaryLayout.Section
      title="Détails de l'offre"
      editLink={editLink}
      onLinkClick={logEditEvent}
    >
      <SummaryLayout.SubSection title="Type d'offre">
        <SummaryLayout.Row title="Catégorie" description={offer.categoryName} />
        <SummaryLayout.Row
          title="Sous-catégorie"
          description={offer.subCategoryName}
        />

        {conditionalFields.includes('musicType') && (
          <SummaryLayout.Row
            title="Genre musical"
            description={offer.musicTypeName || '-'}
          />
        )}
        {offer.musicSubTypeName && (
          <SummaryLayout.Row
            title="Sous-genre"
            description={offer.musicSubTypeName}
          />
        )}
        {conditionalFields.includes('showType') && (
          <SummaryLayout.Row
            title="Type de spéctacle"
            description={offer.showTypeName || '-'}
          />
        )}
        {offer.showSubTypeName && (
          <SummaryLayout.Row
            title="Sous-type"
            description={offer.showSubTypeName}
          />
        )}
      </SummaryLayout.SubSection>

      <SummaryLayout.SubSection title="Informations artistiques">
        <SummaryLayout.Row title="Titre de l'offre" description={offer.name} />
        <SummaryLayout.Row
          title="Description"
          description={offer.description || ' - '}
        />

        {conditionalFields.includes('speaker') && (
          <SummaryLayout.Row title="Intervenant" description={offer.speaker} />
        )}
        {conditionalFields.includes('author') && (
          <SummaryLayout.Row title="Auteur" description={offer.author} />
        )}
        {conditionalFields.includes('visa') && (
          <SummaryLayout.Row
            title="Visa d’exploitation"
            description={offer.visa}
          />
        )}
        {conditionalFields.includes('isbn') && (
          <SummaryLayout.Row title="ISBN" description={offer.isbn} />
        )}
        {conditionalFields.includes('stageDirector') && (
          <SummaryLayout.Row
            title="Metteur en scène"
            description={offer.stageDirector}
          />
        )}
        {conditionalFields.includes('performer') && (
          <SummaryLayout.Row title="Interprète" description={offer.performer} />
        )}
        {conditionalFields.includes('durationMinutes') && (
          <SummaryLayout.Row
            title="Durée"
            description={
              offer.durationMinutes ? `${offer.durationMinutes} min` : '-'
            }
          />
        )}
      </SummaryLayout.SubSection>

      <SummaryLayout.SubSection title="Informations pratiques">
        <SummaryLayout.Row title="Structure" description={offer.offererName} />
        <SummaryLayout.Row
          title="Lieu"
          description={offer.venuePublicName || offer.venueName}
        />
        {offer.withdrawalType && (
          <SummaryLayout.Row
            title="Comment les billets, places seront-ils transmis ?"
            description={OFFER_WITHDRAWAL_TYPE_LABELS[offer.withdrawalType]}
          />
        )}

        {offer.withdrawalDelay && (
          <SummaryLayout.Row
            title="Heure de retrait"
            description={`${humanizeDelay(
              offer.withdrawalDelay
            )} avant le début de l'évènement`}
          />
        )}

        <SummaryLayout.Row
          title="Informations de retrait"
          description={offer.withdrawalDetails || ' - '}
        />
      </SummaryLayout.SubSection>

      <SummaryLayout.SubSection title="Accessibilité">
        {offer.accessibility[AccessiblityEnum.NONE] && (
          <SummaryLayout.Row description="Non accessible" />
        )}
        {offer.accessibility[AccessiblityEnum.VISUAL] && (
          <AccessibilityLabel
            className={styles['accessibility-row']}
            name={AccessiblityEnum.VISUAL}
          />
        )}
        {offer.accessibility[AccessiblityEnum.MENTAL] && (
          <AccessibilityLabel
            className={styles['accessibility-row']}
            name={AccessiblityEnum.MENTAL}
          />
        )}
        {offer.accessibility[AccessiblityEnum.MOTOR] && (
          <AccessibilityLabel
            className={styles['accessibility-row']}
            name={AccessiblityEnum.MOTOR}
          />
        )}
        {offer.accessibility[AccessiblityEnum.AUDIO] && (
          <AccessibilityLabel
            className={styles['accessibility-row']}
            name={AccessiblityEnum.AUDIO}
          />
        )}
      </SummaryLayout.SubSection>

      {conditionalFields.includes('isDuo') && (
        <SummaryLayout.SubSection title="Autres caractéristiques">
          <SummaryLayout.Row
            description={
              offer.isDuo === true
                ? 'Accepter les réservations "Duo"'
                : 'Refuser les réservations "Duo"'
            }
          />
        </SummaryLayout.SubSection>
      )}

      {conditionalFields.includes('url') && (
        <SummaryLayout.SubSection title="Lien pour grand public">
          <SummaryLayout.Row description={offer.url} />
        </SummaryLayout.SubSection>
      )}

      <SummaryLayout.SubSection title="Notifications des réservations">
        {offer.bookingEmail ? (
          <SummaryLayout.Row description={offer.bookingEmail} />
        ) : (
          ' - '
        )}
      </SummaryLayout.SubSection>
    </SummaryLayout.Section>
  )
}

export default OfferSummary
