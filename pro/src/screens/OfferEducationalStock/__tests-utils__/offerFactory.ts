import { OfferStatus } from 'apiClient/v1'
import { GetStockOfferSuccessPayload } from 'core/OfferEducational'

export const offerFactory = (
  offerExtend: Partial<GetStockOfferSuccessPayload>
): GetStockOfferSuccessPayload => ({
  id: 'OFFER_ID',
  isActive: true,
  status: OfferStatus.PENDING,
  isBooked: false,
  isCancellable: true,
  venueDepartmentCode: '75',
  managingOffererId: 'OFFERER_ID',
  isEducational: true,
  isShowcase: false,
  name: 'Offre de test',
  ...offerExtend,
})
