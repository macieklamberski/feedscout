import type { UriEntry } from '../../types.js'

export type GuessMethodOptions = {
  baseUrl: string
  uris: Array<UriEntry>
  additionalBaseUrls?: Array<string>
  // How many directory levels of the base URL's path to also probe with path-style URIs
  // (e.g. /blog/feed.xml for a page under /blog/). 0 or undefined disables ancestor probing.
  maxAncestorDepth?: number
  // Page HTML scanned for same-origin section links (e.g. /blog) to probe with path-style URIs.
  // Filled automatically from the fetched page during discovery.
  content?: string
  // Path segments that mark a linked page as a content section worth probing (e.g. "blog").
  sectionNames?: Array<string>
}
