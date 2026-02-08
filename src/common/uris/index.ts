import type { DiscoverMethodsConfigInternal, DiscoverUrisResult } from '../types.js'
import { discoverUrisFromGuess } from './guess/index.js'
import { discoverUrisFromHeaders } from './headers/index.js'
import { discoverUrisFromHtml } from './html/index.js'
import { discoverUrisFromPlatform } from './platform/index.js'

export const discoverUris = (config: DiscoverMethodsConfigInternal): DiscoverUrisResult => {
  const result: DiscoverUrisResult = {}

  if (config.platform) {
    const uris = discoverUrisFromPlatform(config.platform.html, config.platform.options)

    if (uris.length > 0) {
      result.platform = uris
    }
  }

  if (config.html) {
    const uris = discoverUrisFromHtml(config.html.html, config.html.options)

    if (uris.length > 0) {
      result.html = uris.map((uri) => ({ uri }))
    }
  }

  if (config.headers) {
    const uris = discoverUrisFromHeaders(config.headers.headers, config.headers.options)

    if (uris.length > 0) {
      result.headers = uris.map((uri) => ({ uri }))
    }
  }

  if (config.guess) {
    const uris = discoverUrisFromGuess(config.guess.options)

    if (uris.length > 0) {
      result.guess = uris.map((uri) => ({ uri }))
    }
  }

  return result
}
