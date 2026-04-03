import type {
  DiscoverFetchFn,
  DiscoverMethodsConfigInternal,
  DiscoverUrisResult,
} from '../types.js'
import { discoverUrisFromFeed } from './feed/index.js'
import { discoverUrisFromGuess } from './guess/index.js'
import { discoverUrisFromHeaders } from './headers/index.js'
import { discoverUrisFromHtml } from './html/index.js'
import { discoverUrisFromPlatform } from './platform/index.js'

export const discoverUris = async (
  config: DiscoverMethodsConfigInternal,
  fetchFn?: DiscoverFetchFn,
): Promise<DiscoverUrisResult> => {
  const result: DiscoverUrisResult = {}

  if (config.platform) {
    const uris = await discoverUrisFromPlatform(
      config.platform.content,
      config.platform.headers,
      config.platform.options,
      fetchFn,
    )

    if (uris.length > 0) {
      result.platform = uris
    }
  }

  if (config.feed) {
    const uris = discoverUrisFromFeed(config.feed.content, config.feed.options)

    if (uris.length > 0) {
      result.feed = uris.map((uri) => ({ uri }))
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
