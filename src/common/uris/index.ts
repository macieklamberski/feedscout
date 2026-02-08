import type { DiscoverMethodsConfigInternal, UriEntry } from '../types.js'
import { deduplicateUriEntries } from '../utils.js'
import { discoverUrisFromGuess } from './guess/index.js'
import { discoverUrisFromHeaders } from './headers/index.js'
import { discoverUrisFromHtml } from './html/index.js'
import { discoverUrisFromPlatform } from './platform/index.js'

export const discoverUris = (
  config: DiscoverMethodsConfigInternal,
  stopOnFirstMethod = false,
): Array<UriEntry> => {
  const uris: Array<UriEntry> = []

  if (config.platform) {
    uris.push(...discoverUrisFromPlatform(config.platform.html, config.platform.options))

    if (stopOnFirstMethod && uris.length > 0) {
      return deduplicateUriEntries(uris)
    }
  }

  if (config.html) {
    uris.push(...discoverUrisFromHtml(config.html.html, config.html.options))

    if (stopOnFirstMethod && uris.length > 0) {
      return deduplicateUriEntries(uris)
    }
  }

  if (config.headers) {
    uris.push(...discoverUrisFromHeaders(config.headers.headers, config.headers.options))

    if (stopOnFirstMethod && uris.length > 0) {
      return deduplicateUriEntries(uris)
    }
  }

  if (config.guess) {
    uris.push(...discoverUrisFromGuess(config.guess.options))
  }

  return deduplicateUriEntries(uris)
}
