import { discoverFeedUrisFromGuess } from './guess/index.js'
import { discoverFeedUrisFromHeaders } from './headers/index.js'
import { discoverFeedUrisFromHtml } from './html/index.js'
import type { Config } from './types.js'

export const discoverFeedUris = (config: Config): Array<string> => {
  const feedUris = new Set<string>()

  if (config.html) {
    const htmlUris = discoverFeedUrisFromHtml(config.html.html, config.html.options)

    for (const uri of htmlUris) {
      feedUris.add(uri)
    }
  }

  if (config.headers) {
    const headersUris = discoverFeedUrisFromHeaders(config.headers.headers, config.headers.options)

    for (const uri of headersUris) {
      feedUris.add(uri)
    }
  }

  if (config.guess) {
    const guessUris = discoverFeedUrisFromGuess(config.guess.options)

    for (const uri of guessUris) {
      feedUris.add(uri)
    }
  }

  return Array.from(feedUris)
}
