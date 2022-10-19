/* tslint:disable */
/* eslint-disable */
/**
 * pass Culture backoffice API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime'
import {
  OffererBankInformationStatus,
  OffererBankInformationStatusFromJSON,
  OffererBankInformationStatusFromJSONTyped,
  OffererBankInformationStatusToJSON,
} from './'

/**
 *
 * @export
 * @interface OffererBasicInfo
 */
export interface OffererBasicInfo {
  /**
   *
   * @type {OffererBankInformationStatus}
   * @memberof OffererBasicInfo
   */
  bankInformationStatus: OffererBankInformationStatus
  /**
   *
   * @type {number}
   * @memberof OffererBasicInfo
   */
  id: number
  /**
   *
   * @type {boolean}
   * @memberof OffererBasicInfo
   */
  isActive: boolean
  /**
   *
   * @type {boolean}
   * @memberof OffererBasicInfo
   */
  isCollectiveEligible: boolean
  /**
   *
   * @type {boolean}
   * @memberof OffererBasicInfo
   */
  isTopActor: boolean
  /**
   *
   * @type {string}
   * @memberof OffererBasicInfo
   */
  name: string
  /**
   *
   * @type {string}
   * @memberof OffererBasicInfo
   */
  region: string
  /**
   *
   * @type {string}
   * @memberof OffererBasicInfo
   */
  siren: string
}

export function OffererBasicInfoFromJSON(json: any): OffererBasicInfo {
  return OffererBasicInfoFromJSONTyped(json, false)
}

export function OffererBasicInfoFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean
): OffererBasicInfo {
  if (json === undefined || json === null) {
    return json
  }
  return {
    bankInformationStatus: OffererBankInformationStatusFromJSON(
      json['bankInformationStatus']
    ),
    id: json['id'],
    isActive: json['isActive'],
    isCollectiveEligible: json['isCollectiveEligible'],
    isTopActor: json['isTopActor'],
    name: json['name'],
    region: json['region'],
    siren: json['siren'],
  }
}

export function OffererBasicInfoToJSON(value?: OffererBasicInfo | null): any {
  if (value === undefined) {
    return undefined
  }
  if (value === null) {
    return null
  }
  return {
    bankInformationStatus: OffererBankInformationStatusToJSON(
      value.bankInformationStatus
    ),
    id: value.id,
    isActive: value.isActive,
    isCollectiveEligible: value.isCollectiveEligible,
    isTopActor: value.isTopActor,
    name: value.name,
    region: value.region,
    siren: value.siren,
  }
}
