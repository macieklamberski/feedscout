import type { DiscoverMethodsConfigInternal } from '../types.js'
import { discoverUrisFromGuess } from './guess/index.js'
import { discoverUrisFromHeaders } from './headers/index.js'
import { discoverUrisFromHtml } from './html/index.js'
import { discoverUrisFromPlatform } from './platform/index.js'

export const discoverUris = (config: DiscoverMethodsConfigInternal): Array<string> => {
  const uris = new Set<string>()

  if (config.platform) {
    for (const uri of discoverUrisFromPlatform(config.platform.html, config.platform.options)) {
      uris.add(uri)
    }
  }

  if (config.html) {
    for (const uri of discoverUrisFromHtml(config.html.html, config.html.options)) {
      uris.add(uri)
    }
  }

  if (config.headers) {
    for (const uri of discoverUrisFromHeaders(config.headers.headers, config.headers.options)) {
      uris.add(uri)
    }
  }

  if (config.guess) {
    for (const uri of discoverUrisFromGuess(config.guess.options)) {
      uris.add(uri)
    }
  }

  return Array.from(uris)
}
