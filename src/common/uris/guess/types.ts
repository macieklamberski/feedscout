import type { UriEntry } from '../../types.js'

export type GuessMethodOptions = {
  baseUrl: string
  uris: Array<UriEntry>
  additionalBaseUrls?: Array<string>
  // How many directory levels of the base URL's path to also probe with path-style URIs
  // (e.g. /blog/feed.xml for a page under /blog/). 0 or undefined disables ancestor probing.
  maxAncestorDepth?: number
}
