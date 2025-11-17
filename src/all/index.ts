import { discoverCommonFeedUrisFromGuess } from '../guess/index.js'
import { discoverFeedUrisFromHeaders } from '../headers/index.js'
import { discoverFeedUrisFromHtml } from '../html/index.js'
import type { Config } from './types.js'

export const discoverFeedUris = async (config: Config): Promise<Array<string>> => {
  const feedUris = new Set<string>()

  // TODO: the implementation of different discover methods in this function could be optimized
  // once multiple methods use the same logic. For example, if parsing of the HTML is used more
  // than once, we could do it in one pass by utilizing, eg. direct parser HTML handlers.

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
    const guessResults = await discoverCommonFeedUrisFromGuess(
      config.guess.baseUrl,
      config.guess.options,
    )

    for (const result of guessResults) {
      if (result.isFeed) {
        feedUris.add(result.url)
      }
    }
  }

  return Array.from(feedUris)
}
