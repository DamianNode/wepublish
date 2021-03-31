import {ContentContextEnum} from '../api'

export const MediaReferenceType = '__media'

export interface Reference {
  recordId: string
  contentType: string
  peerId?: string
  record?: any
  peer?: any
}

export interface ContentModelSchemaFieldRefTypeMap {
  [contentType: string]: {
    scope: ContentContextEnum
  }
}
