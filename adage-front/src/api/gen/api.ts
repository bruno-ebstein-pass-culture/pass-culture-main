/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/explicit-module-boundary-types */
/**
 * Pass Culture API accessed through iframe from adage clients
 * No description provided (generated by Swagger Codegen https://github.com/swagger-api/swagger-codegen)
 *
 * OpenAPI spec version: 0.1.0
 *
 *
 * NOTE: This file is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the file manually.
 */
import url from 'url'

import { handleGeneratedApiResponse, safeFetch } from 'api/helpers'

import { APIConfiguration } from './configuration'

const BASE_PATH = '/'.replace(/\/+$/, '')

export interface FetchArgs {
  url: string
  options: any
}

export class BaseAPI {
  protected configuration?: APIConfiguration
  constructor(
    configuration?: APIConfiguration,
    protected basePath: string = BASE_PATH
  ) {
    if (configuration) {
      this.configuration = configuration
      this.basePath = configuration.basePath || this.basePath
    }
  }
}

export class RequiredError extends Error {
  name = 'RequiredError'
  constructor(public field: string, msg?: string) {
    super(msg)
  }
}

export enum AdageFrontRoles {
  Redactor = 'redactor',
  Readonly = 'readonly',
}
export interface AuthenticatedResponse {
  role: AdageFrontRoles
  uai?: string | null
}

export interface BookCollectiveOfferRequest {
  stockId: number
}

export interface BookCollectiveOfferResponse {
  bookingId: number
}

export interface CategoriesResponseModel {
  categories: Array<CategoryResponseModel>
  subcategories: Array<SubcategoryResponseModel>
}

export interface CategoryResponseModel {
  id: string
  proLabel: string
}

export interface CollectiveOfferOfferVenue {
  addressType: OfferAddressType
  otherAddress: string
  venueId: string
}

export interface CollectiveOfferResponseModel {
  audioDisabilityCompliant: boolean
  contactEmail: string
  contactPhone: string
  description?: string | null
  domains: Array<OfferDomain>
  durationMinutes?: number | null
  educationalInstitution?: EducationalInstitutionResponseModel | null
  educationalPriceDetail?: string | null
  id: number
  interventionArea: Array<string>
  isExpired: boolean
  isSoldOut: boolean
  mentalDisabilityCompliant: boolean
  motorDisabilityCompliant: boolean
  name: string
  offerId?: string | null
  offerVenue: CollectiveOfferOfferVenue
  stock: OfferStockResponse
  students: Array<StudentLevels>
  subcategoryLabel: string
  venue: OfferVenueResponse
  visualDisabilityCompliant: boolean
}

export interface CollectiveOfferTemplateResponseModel {
  audioDisabilityCompliant: boolean
  contactEmail: string
  contactPhone: string
  description?: string | null
  domains: Array<OfferDomain>
  durationMinutes?: number | null
  educationalPriceDetail?: string | null
  id: number
  interventionArea: Array<string>
  isExpired: boolean
  isSoldOut: boolean
  mentalDisabilityCompliant: boolean
  motorDisabilityCompliant: boolean
  name: string
  offerId?: string | null
  offerVenue: CollectiveOfferOfferVenue
  students: Array<StudentLevels>
  subcategoryLabel: string
  venue: OfferVenueResponse
  visualDisabilityCompliant: boolean
}

export interface Coordinates {
  latitude?: number | null
  longitude?: number | null
}

export interface EducationalInstitutionResponseModel {
  city: string
  id: number
  name: string
  postalCode: string
}

export interface FeatureResponseModel {
  description: string
  id: string
  isActive: boolean
  name: string
  nameKey: string
}

export type ListFeatureResponseModel = Array<FeatureResponseModel>

export enum OfferAddressType {
  OffererVenue = 'offererVenue',
  School = 'school',
  Other = 'other',
}
export interface OfferDomain {
  id: number
  name: string
}

export interface OfferManagingOffererResponse {
  name: string
}

export interface OfferStockResponse {
  beginningDatetime?: string | null
  bookingLimitDatetime?: string | null
  educationalPriceDetail?: string | null
  id: number
  isBookable: boolean
  numberOfTickets?: number | null
  price: number
}

export interface OfferVenueResponse {
  address?: string | null
  city?: string | null
  coordinates: Coordinates
  id: number
  managingOfferer: OfferManagingOffererResponse
  name: string
  postalCode?: string | null
  publicName?: string | null
}

export enum StudentLevels {
  Collge4e = 'Collège - 4e',
  Collge3e = 'Collège - 3e',
  CAP1reAnne = 'CAP - 1re année',
  CAP2eAnne = 'CAP - 2e année',
  LyceSeconde = 'Lycée - Seconde',
  LycePremire = 'Lycée - Première',
  LyceTerminale = 'Lycée - Terminale',
}
export interface SubcategoryResponseModel {
  categoryId: string
  id: string
}

export type ValidationError = Array<ValidationErrorElement>

export interface ValidationErrorElement {
  ctx?: any
  loc: Array<string>
  msg: string
  type: string
}

export interface VenueResponse {
  id: number
  name: string
  publicName?: string | null
}

/**
 * DefaultApi - fetch parameter creator
 * @export
 */
export const DefaultApiFetchParamCreator = function (
  configuration?: APIConfiguration
) {
  return {
    /**
     *
     * @summary authenticate <GET>
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeAuthenticate(options: any = {}): Promise<FetchArgs> {
      const localVarPath = `/adage-iframe/authenticate`
      const localVarUrlObj = url.parse(localVarPath, true)
      const localVarRequestOptions = Object.assign(
        {
          method: 'GET',
          credentials: 'includes',
        },
        options
      )
      const localVarHeaderParameter = {} as any
      const localVarQueryParameter = {} as any
      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      )
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      )
      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      }
    },
    /**
     *
     * @summary get_collective_offer <GET>
     * @param {number} offerId
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetCollectiveOffer(
      offerId: number,
      options: any = {}
    ): Promise<FetchArgs> {
      // verify required parameter 'offerId' is not null or undefined
      if (offerId === null || offerId === undefined) {
        throw new RequiredError(
          'offerId',
          'Required parameter offerId was null or undefined when calling getAdageIframeGetCollectiveOffer.'
        )
      }
      const localVarPath = `/adage-iframe/collective/offers/{offer_id}`.replace(
        `{${'offer_id'}}`,
        encodeURIComponent(String(offerId))
      )
      const localVarUrlObj = url.parse(localVarPath, true)
      const localVarRequestOptions = Object.assign(
        {
          method: 'GET',
          credentials: 'includes',
        },
        options
      )
      const localVarHeaderParameter = {} as any
      const localVarQueryParameter = {} as any
      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      )
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      )
      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      }
    },
    /**
     *
     * @summary get_collective_offer_template <GET>
     * @param {number} offerId
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetCollectiveOfferTemplate(
      offerId: number,
      options: any = {}
    ): Promise<FetchArgs> {
      // verify required parameter 'offerId' is not null or undefined
      if (offerId === null || offerId === undefined) {
        throw new RequiredError(
          'offerId',
          'Required parameter offerId was null or undefined when calling getAdageIframeGetCollectiveOfferTemplate.'
        )
      }
      const localVarPath =
        `/adage-iframe/collective/offers-template/{offer_id}`.replace(
          `{${'offer_id'}}`,
          encodeURIComponent(String(offerId))
        )
      const localVarUrlObj = url.parse(localVarPath, true)
      const localVarRequestOptions = Object.assign(
        {
          method: 'GET',
          credentials: 'includes',
        },
        options
      )
      const localVarHeaderParameter = {} as any
      const localVarQueryParameter = {} as any
      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      )
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      )
      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      }
    },
    /**
     *
     * @summary get_educational_offers_categories <GET>
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetEducationalOffersCategories(
      options: any = {}
    ): Promise<FetchArgs> {
      const localVarPath = `/adage-iframe/offers/categories`
      const localVarUrlObj = url.parse(localVarPath, true)
      const localVarRequestOptions = Object.assign(
        {
          method: 'GET',
          credentials: 'includes',
        },
        options
      )
      const localVarHeaderParameter = {} as any
      const localVarQueryParameter = {} as any
      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      )
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      )
      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      }
    },
    /**
     *
     * @summary get_venue_by_id <GET>
     * @param {number} venueId
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetVenueById(
      venueId: number,
      options: any = {}
    ): Promise<FetchArgs> {
      // verify required parameter 'venueId' is not null or undefined
      if (venueId === null || venueId === undefined) {
        throw new RequiredError(
          'venueId',
          'Required parameter venueId was null or undefined when calling getAdageIframeGetVenueById.'
        )
      }
      const localVarPath = `/adage-iframe/venues/{venue_id}`.replace(
        `{${'venue_id'}}`,
        encodeURIComponent(String(venueId))
      )
      const localVarUrlObj = url.parse(localVarPath, true)
      const localVarRequestOptions = Object.assign(
        {
          method: 'GET',
          credentials: 'includes',
        },
        options
      )
      const localVarHeaderParameter = {} as any
      const localVarQueryParameter = {} as any
      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      )
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      )
      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      }
    },
    /**
     *
     * @summary get_venue_by_siret <GET>
     * @param {string} siret
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetVenueBySiret(
      siret: string,
      options: any = {}
    ): Promise<FetchArgs> {
      // verify required parameter 'siret' is not null or undefined
      if (siret === null || siret === undefined) {
        throw new RequiredError(
          'siret',
          'Required parameter siret was null or undefined when calling getAdageIframeGetVenueBySiret.'
        )
      }
      const localVarPath = `/adage-iframe/venues/siret/{siret}`.replace(
        `{${'siret'}}`,
        encodeURIComponent(String(siret))
      )
      const localVarUrlObj = url.parse(localVarPath, true)
      const localVarRequestOptions = Object.assign(
        {
          method: 'GET',
          credentials: 'includes',
        },
        options
      )
      const localVarHeaderParameter = {} as any
      const localVarQueryParameter = {} as any
      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      )
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      )
      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      }
    },
    /**
     *
     * @summary list_features <GET>
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeListFeatures(options: any = {}): Promise<FetchArgs> {
      const localVarPath = `/adage-iframe/features`
      const localVarUrlObj = url.parse(localVarPath, true)
      const localVarRequestOptions = Object.assign(
        {
          method: 'GET',
          credentials: 'includes',
        },
        options
      )
      const localVarHeaderParameter = {} as any
      const localVarQueryParameter = {} as any
      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      )
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      )
      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      }
    },
    /**
     *
     * @summary book_collective_offer <POST>
     * @param {BookCollectiveOfferRequest} [body]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async postAdageIframeBookCollectiveOffer(
      body?: BookCollectiveOfferRequest,
      options: any = {}
    ): Promise<FetchArgs> {
      const localVarPath = `/adage-iframe/collective/bookings`
      const localVarUrlObj = url.parse(localVarPath, true)
      const localVarRequestOptions = Object.assign(
        {
          method: 'POST',
          credentials: 'includes',
        },
        options
      )
      const localVarHeaderParameter = {} as any
      const localVarQueryParameter = {} as any
      localVarHeaderParameter['Content-Type'] = 'application/json'
      localVarUrlObj.query = Object.assign(
        {},
        localVarUrlObj.query,
        localVarQueryParameter,
        options.query
      )
      // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
      localVarUrlObj.search = null
      localVarRequestOptions.headers = Object.assign(
        {},
        localVarHeaderParameter,
        options.headers
      )
      const needsSerialization =
        <any>'BookCollectiveOfferRequest' !== 'string' ||
        localVarRequestOptions.headers['Content-Type'] === 'application/json'
      localVarRequestOptions.body = needsSerialization
        ? JSON.stringify(body || {})
        : body || ''
      return {
        url: url.format(localVarUrlObj),
        options: localVarRequestOptions,
      }
    },
  }
}

/**
 * DefaultApi - functional programming interface
 * @export
 */
export const DefaultApiFp = function (
  api: DefaultApi,
  configuration?: APIConfiguration
) {
  return {
    /**
     *
     * @summary authenticate <GET>
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeAuthenticate(
      basePath: string,
      options?: any
    ): Promise<AuthenticatedResponse> {
      const localVarFetchArgs = await DefaultApiFetchParamCreator(
        configuration
      ).getAdageIframeAuthenticate(options)
      const response = await safeFetch(
        basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      )
      return handleGeneratedApiResponse(response)
    },
    /**
     *
     * @summary get_collective_offer <GET>
     * @param {number} offerId
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetCollectiveOffer(
      basePath: string,
      offerId: number,
      options?: any
    ): Promise<CollectiveOfferResponseModel> {
      const localVarFetchArgs = await DefaultApiFetchParamCreator(
        configuration
      ).getAdageIframeGetCollectiveOffer(offerId, options)
      const response = await safeFetch(
        basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      )
      return handleGeneratedApiResponse(response)
    },
    /**
     *
     * @summary get_collective_offer_template <GET>
     * @param {number} offerId
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetCollectiveOfferTemplate(
      basePath: string,
      offerId: number,
      options?: any
    ): Promise<CollectiveOfferTemplateResponseModel> {
      const localVarFetchArgs = await DefaultApiFetchParamCreator(
        configuration
      ).getAdageIframeGetCollectiveOfferTemplate(offerId, options)
      const response = await safeFetch(
        basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      )
      return handleGeneratedApiResponse(response)
    },
    /**
     *
     * @summary get_educational_offers_categories <GET>
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetEducationalOffersCategories(
      basePath: string,
      options?: any
    ): Promise<CategoriesResponseModel> {
      const localVarFetchArgs = await DefaultApiFetchParamCreator(
        configuration
      ).getAdageIframeGetEducationalOffersCategories(options)
      const response = await safeFetch(
        basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      )
      return handleGeneratedApiResponse(response)
    },
    /**
     *
     * @summary get_venue_by_id <GET>
     * @param {number} venueId
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetVenueById(
      basePath: string,
      venueId: number,
      options?: any
    ): Promise<VenueResponse> {
      const localVarFetchArgs = await DefaultApiFetchParamCreator(
        configuration
      ).getAdageIframeGetVenueById(venueId, options)
      const response = await safeFetch(
        basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      )
      return handleGeneratedApiResponse(response)
    },
    /**
     *
     * @summary get_venue_by_siret <GET>
     * @param {string} siret
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeGetVenueBySiret(
      basePath: string,
      siret: string,
      options?: any
    ): Promise<VenueResponse> {
      const localVarFetchArgs = await DefaultApiFetchParamCreator(
        configuration
      ).getAdageIframeGetVenueBySiret(siret, options)
      const response = await safeFetch(
        basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      )
      return handleGeneratedApiResponse(response)
    },
    /**
     *
     * @summary list_features <GET>
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async getAdageIframeListFeatures(
      basePath: string,
      options?: any
    ): Promise<ListFeatureResponseModel> {
      const localVarFetchArgs = await DefaultApiFetchParamCreator(
        configuration
      ).getAdageIframeListFeatures(options)
      const response = await safeFetch(
        basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      )
      return handleGeneratedApiResponse(response)
    },
    /**
     *
     * @summary book_collective_offer <POST>
     * @param {BookCollectiveOfferRequest} [body]
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     */
    async postAdageIframeBookCollectiveOffer(
      basePath: string,
      body?: BookCollectiveOfferRequest,
      options?: any
    ): Promise<BookCollectiveOfferResponse> {
      const localVarFetchArgs = await DefaultApiFetchParamCreator(
        configuration
      ).postAdageIframeBookCollectiveOffer(body, options)
      const response = await safeFetch(
        basePath + localVarFetchArgs.url,
        localVarFetchArgs.options
      )
      return handleGeneratedApiResponse(response)
    },
  }
}

/**
 * DefaultApi - interface
 * @export
 * @interface DefaultApi
 */
export interface DefaultApiInterface {
  /**
   *
   * @summary authenticate <GET>
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApiInterface
   */
  getAdageIframeAuthenticate(options?: any): Promise<AuthenticatedResponse>

  /**
   *
   * @summary get_collective_offer <GET>
   * @param {number} offerId
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApiInterface
   */
  getAdageIframeGetCollectiveOffer(
    offerId: number,
    options?: any
  ): Promise<CollectiveOfferResponseModel>

  /**
   *
   * @summary get_collective_offer_template <GET>
   * @param {number} offerId
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApiInterface
   */
  getAdageIframeGetCollectiveOfferTemplate(
    offerId: number,
    options?: any
  ): Promise<CollectiveOfferTemplateResponseModel>

  /**
   *
   * @summary get_educational_offers_categories <GET>
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApiInterface
   */
  getAdageIframeGetEducationalOffersCategories(
    options?: any
  ): Promise<CategoriesResponseModel>

  /**
   *
   * @summary get_venue_by_id <GET>
   * @param {number} venueId
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApiInterface
   */
  getAdageIframeGetVenueById(
    venueId: number,
    options?: any
  ): Promise<VenueResponse>

  /**
   *
   * @summary get_venue_by_siret <GET>
   * @param {string} siret
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApiInterface
   */
  getAdageIframeGetVenueBySiret(
    siret: string,
    options?: any
  ): Promise<VenueResponse>

  /**
   *
   * @summary list_features <GET>
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApiInterface
   */
  getAdageIframeListFeatures(options?: any): Promise<ListFeatureResponseModel>

  /**
   *
   * @summary book_collective_offer <POST>
   * @param {BookCollectiveOfferRequest} [body]
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApiInterface
   */
  postAdageIframeBookCollectiveOffer(
    body?: BookCollectiveOfferRequest,
    options?: any
  ): Promise<BookCollectiveOfferResponse>
}

/**
 * DefaultApi - object-oriented interface
 * @export
 * @class DefaultApi
 * @extends {BaseAPI}
 */
export class DefaultApi extends BaseAPI implements DefaultApiInterface {
  /**
   *
   * @summary authenticate <GET>
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  public async getAdageIframeAuthenticate(
    options?: any
  ): Promise<AuthenticatedResponse> {
    const functionalApi = DefaultApiFp(this, this.configuration)
    return functionalApi.getAdageIframeAuthenticate(this.basePath, options)
  }
  /**
   *
   * @summary get_collective_offer <GET>
   * @param {number} offerId
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  public async getAdageIframeGetCollectiveOffer(
    offerId: number,
    options?: any
  ): Promise<CollectiveOfferResponseModel> {
    const functionalApi = DefaultApiFp(this, this.configuration)
    return functionalApi.getAdageIframeGetCollectiveOffer(
      this.basePath,
      offerId,
      options
    )
  }
  /**
   *
   * @summary get_collective_offer_template <GET>
   * @param {number} offerId
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  public async getAdageIframeGetCollectiveOfferTemplate(
    offerId: number,
    options?: any
  ): Promise<CollectiveOfferTemplateResponseModel> {
    const functionalApi = DefaultApiFp(this, this.configuration)
    return functionalApi.getAdageIframeGetCollectiveOfferTemplate(
      this.basePath,
      offerId,
      options
    )
  }
  /**
   *
   * @summary get_educational_offers_categories <GET>
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  public async getAdageIframeGetEducationalOffersCategories(
    options?: any
  ): Promise<CategoriesResponseModel> {
    const functionalApi = DefaultApiFp(this, this.configuration)
    return functionalApi.getAdageIframeGetEducationalOffersCategories(
      this.basePath,
      options
    )
  }
  /**
   *
   * @summary get_venue_by_id <GET>
   * @param {number} venueId
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  public async getAdageIframeGetVenueById(
    venueId: number,
    options?: any
  ): Promise<VenueResponse> {
    const functionalApi = DefaultApiFp(this, this.configuration)
    return functionalApi.getAdageIframeGetVenueById(
      this.basePath,
      venueId,
      options
    )
  }
  /**
   *
   * @summary get_venue_by_siret <GET>
   * @param {string} siret
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  public async getAdageIframeGetVenueBySiret(
    siret: string,
    options?: any
  ): Promise<VenueResponse> {
    const functionalApi = DefaultApiFp(this, this.configuration)
    return functionalApi.getAdageIframeGetVenueBySiret(
      this.basePath,
      siret,
      options
    )
  }
  /**
   *
   * @summary list_features <GET>
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  public async getAdageIframeListFeatures(
    options?: any
  ): Promise<ListFeatureResponseModel> {
    const functionalApi = DefaultApiFp(this, this.configuration)
    return functionalApi.getAdageIframeListFeatures(this.basePath, options)
  }
  /**
   *
   * @summary book_collective_offer <POST>
   * @param {BookCollectiveOfferRequest} [body]
   * @param {*} [options] Override http request option.
   * @throws {RequiredError}
   * @memberof DefaultApi
   */
  public async postAdageIframeBookCollectiveOffer(
    body?: BookCollectiveOfferRequest,
    options?: any
  ): Promise<BookCollectiveOfferResponse> {
    const functionalApi = DefaultApiFp(this, this.configuration)
    return functionalApi.postAdageIframeBookCollectiveOffer(
      this.basePath,
      body,
      options
    )
  }
}
