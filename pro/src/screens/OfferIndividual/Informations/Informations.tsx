import { FormikProvider, useFormik } from 'formik'
import React, { useState } from 'react'

import FormLayout from 'components/FormLayout'
import { IOnImageUploadArgs } from 'components/ImageUploader/ButtonImageEdit/ModalImageEdit/ModalImageEdit'
import {
  IOfferIndividualFormValues,
  OfferIndividualForm,
  validationSchema,
} from 'components/OfferIndividualForm'
import { OFFER_WIZARD_STEP_IDS } from 'components/OfferIndividualStepper'
import { RouteLeavingGuardOfferIndividual } from 'components/RouteLeavingGuardOfferIndividual'
import { useOfferIndividualContext } from 'context/OfferIndividualContext'
import { OFFER_WIZARD_MODE } from 'core/Offers'
import {
  createIndividualOffer,
  getOfferIndividualAdapter,
  updateIndividualOffer,
} from 'core/Offers/adapters'
import { createThumbnailAdapter } from 'core/Offers/adapters/createThumbnailAdapter'
import { deleteThumbnailAdapter } from 'core/Offers/adapters/deleteThumbnailAdapter'
import { IOfferIndividualImage } from 'core/Offers/types'
import { getOfferIndividualUrl } from 'core/Offers/utils/getOfferIndividualUrl'
import { TOfferIndividualVenue } from 'core/Venue/types'
import { useNavigate, useOfferWizardMode } from 'hooks'
import useNotification from 'hooks/useNotification'

import { ActionBar } from '../ActionBar'

import { filterCategories } from './utils'
import { imageFileToDataUrl } from './utils/files'

export interface IInformationsProps {
  initialValues: IOfferIndividualFormValues
  readOnlyFields?: string[]
}

const Informations = ({
  initialValues,
  readOnlyFields = [],
}: IInformationsProps): JSX.Element => {
  const notify = useNotification()
  const navigate = useNavigate()
  const mode = useOfferWizardMode()
  const {
    offerId,
    offer,
    categories,
    subCategories,
    offererNames,
    venueList,
    setOffer,
  } = useOfferIndividualContext()
  const [imageOfferCreationArgs, setImageOfferCreationArgs] = useState<
    IOnImageUploadArgs | undefined
  >(undefined)
  const [imageOffer, setImageOffer] = useState<
    IOfferIndividualImage | undefined
  >(offer && offer.image ? offer.image : undefined)
  const [isSubmittingDraft, setIsSubmittingDraft] = useState<boolean>(false)
  const [
    isSubmittingFromRouteLeavingGuard,
    setIsSubmittingFromRouteLeavingGuard,
  ] = useState<boolean>(false)
  const [isClickingFromActionBar, setIsClickingFromActionBar] =
    useState<boolean>(false)

  const handleNextStep =
    ({ saveDraft = false } = {}) =>
    () => {
      setIsClickingFromActionBar(true)
      setIsSubmittingDraft(saveDraft)
      if (Object.keys(formik.errors).length !== 0) {
        /* istanbul ignore next: DEBT, TO FIX */
        if (saveDraft) {
          notify.error(
            'Des informations sont nécessaires pour sauvegarder le brouillon'
          )
        } else {
          notify.error(
            'Une ou plusieurs erreurs sont présentes dans le formulaire'
          )
        }
      }
      formik.handleSubmit()
    }

  // FIXME: find a way to test FileReader
  /* istanbul ignore next: DEBT, TO FIX */
  const submitImage = async ({
    imageOfferId,
    imageFile,
    credit,
    cropParams,
  }: IOnImageUploadArgs & { imageOfferId: string }) => {
    const response = await createThumbnailAdapter({
      offerId: imageOfferId,
      credit,
      imageFile,
      cropParams,
    })

    if (response.isOk) {
      setImageOffer({
        originalUrl: response.payload.url,
        url: response.payload.url,
        credit: response.payload.credit,
      })
      return Promise.resolve()
    }
    return Promise.reject()
  }

  // FIXME: find a way to test FileReader
  /* istanbul ignore next: DEBT, TO FIX */
  const onImageUpload = async ({
    imageFile,
    imageCroppedDataUrl,
    credit,
    cropParams,
  }: IOnImageUploadArgs) => {
    if (offerId === null) {
      setImageOfferCreationArgs({
        imageFile,
        credit,
        cropParams,
      })
      imageFileToDataUrl(imageFile, imageUrl => {
        setImageOffer({
          originalUrl: imageUrl,
          url: imageCroppedDataUrl || imageUrl,
          credit,
          cropParams: cropParams
            ? {
                xCropPercent: cropParams.x,
                yCropPercent: cropParams.y,
                heightCropPercent: cropParams.height,
                widthCropPercent: cropParams.width,
              }
            : undefined,
        })
      })
    } else {
      submitImage({
        imageOfferId: offerId,
        imageFile,
        credit,
        cropParams,
      })
        .then(() => {
          notify.success('Brouillon sauvegardé dans la liste des offres')
        })
        .catch(() => {
          notify.error(
            'Une erreur est survenue lors de la sauvegarde de vos modifications.\n Merci de réessayer plus tard'
          )
        })
      return Promise.resolve()
    }
  }

  const onImageDelete = async () => {
    /* istanbul ignore next: DEBT, TO FIX */
    if (!offerId) {
      /* istanbul ignore next: DEBT, TO FIX */
      setImageOffer(undefined)
      /* istanbul ignore next: DEBT, TO FIX */
      setImageOfferCreationArgs(undefined)
    } else {
      const response = await deleteThumbnailAdapter({ offerId })
      if (response.isOk) {
        setImageOffer(undefined)
      } else {
        notify.error('Une erreur est survenue. Merci de réessayer plus tard.')
      }
    }
    Promise.resolve()
  }

  const onSubmitOffer = async (formValues: IOfferIndividualFormValues) => {
    const { isOk, payload } =
      offerId === null
        ? await createIndividualOffer(formValues)
        : await updateIndividualOffer({ offerId, formValues })
    let nextStep = OFFER_WIZARD_STEP_IDS.INFORMATIONS

    if (isOk) {
      // FIXME: find a way to test FileReader
      /* istanbul ignore next: DEBT, TO FIX */
      imageOfferCreationArgs &&
        (await submitImage({
          ...imageOfferCreationArgs,
          imageOfferId: payload.id,
        }))
      const response = await getOfferIndividualAdapter(payload.id)
      // This do not trigger a visal change, it's complicated to test
      /* istanbul ignore next: DEBT, TO FIX */
      if (response.isOk) {
        setOffer && setOffer(response.payload)
      }
      notify.success(
        mode === OFFER_WIZARD_MODE.EDITION
          ? 'Vos modifications ont bien été enregistrées'
          : 'Brouillon sauvegardé dans la liste des offres'
      )
      if (!isSubmittingFromRouteLeavingGuard) {
        navigate(
          getOfferIndividualUrl({
            offerId: payload.id,
            step: nextStep,
            mode,
          }),
          { replace: true }
        )

        if (!isSubmittingDraft) {
          nextStep =
            mode === OFFER_WIZARD_MODE.EDITION
              ? OFFER_WIZARD_STEP_IDS.SUMMARY
              : OFFER_WIZARD_STEP_IDS.STOCKS
        }

        navigate(
          getOfferIndividualUrl({
            offerId: payload.id,
            step: nextStep,
            mode,
          })
        )
      }
    } else {
      formik.setErrors(payload.errors)
    }
    setIsClickingFromActionBar(false)
  }

  const formik = useFormik({
    initialValues,
    onSubmit: onSubmitOffer,
    validationSchema,
    // enableReinitialize is needed to reset dirty after submit (and not block after saving a draft)
    enableReinitialize: true,
  })

  const initialVenue: TOfferIndividualVenue | undefined = venueList.find(
    venue => venue.id === initialValues.venueId
  )

  const [filteredCategories, filteredSubCategories] = filterCategories(
    categories,
    subCategories,
    initialVenue
  )

  return (
    <FormikProvider value={formik}>
      <FormLayout small>
        <form onSubmit={formik.handleSubmit}>
          <OfferIndividualForm
            offererNames={offererNames}
            venueList={venueList}
            categories={filteredCategories}
            subCategories={filteredSubCategories}
            readOnlyFields={readOnlyFields}
            onImageUpload={onImageUpload}
            onImageDelete={onImageDelete}
            imageOffer={imageOffer}
          />
          <ActionBar
            onClickNext={handleNextStep()}
            onClickSaveDraft={handleNextStep({ saveDraft: true })}
            step={OFFER_WIZARD_STEP_IDS.INFORMATIONS}
            isDisabled={formik.isSubmitting}
          />
        </form>
      </FormLayout>
      {formik.dirty && !isClickingFromActionBar && (
        <RouteLeavingGuardOfferIndividual
          saveForm={formik.handleSubmit}
          setIsSubmittingFromRouteLeavingGuard={
            setIsSubmittingFromRouteLeavingGuard
          }
          mode={mode}
          hasOfferBeenCreated={!!offerId}
          isFormValid={formik.isValid}
        />
      )}
    </FormikProvider>
  )
}

export default Informations
