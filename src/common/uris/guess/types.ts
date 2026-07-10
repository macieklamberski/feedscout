import type { UriEntry } from '../../types.js'

export type GuessMethodOptions = {
  baseUrl: string
  uris: Array<UriEntry>
  additionalBaseUrls?: Array<string>
}
