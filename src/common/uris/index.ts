import { coerceArray, isString } from 'trousse'
import type {
  DiscoverMethodsConfigInternal,
  DiscoverOnErrorFn,
  DiscoverUrisResult,
  FetchFn,
  UriEntry,
} from '../types.js'
import { discoverUrisFromFeed } from './feed/index.js'
import { discoverUrisFromGuess } from './guess/index.js'
import { discoverUrisFromHeaders } from './headers/index.js'
import { discoverUrisFromHtml } from './html/index.js'
import { discoverUrisFromPlatform, getFeedHint } from './platform/index.js'
import type { PlatformHandler } from './platform/types.js'

// A guess is kept when no handler claims it as one of its feeds or the platform emitted it: a
// guessed `/feed.xml` on a platform host can be the feed of a user named feed. An entry with
// alternatives keeps the ones that pass and is dropped when none do.
const excludeGuesses = (
  guesses: Array<UriEntry>,
  handlers: Array<PlatformHandler>,
  platformUris: Array<string>,
): Array<UriEntry> => {
  const isKept = (uri: string) => {
    return platformUris.includes(uri) || !getFeedHint(handlers, uri)
  }

  return guesses.flatMap((guess): Array<UriEntry> => {
    const alternatives = coerceArray(guess).filter(isKept)

    if (alternatives.length === 0) {
      return []
    }

    if (isString(guess)) {
      return alternatives
    }

    return [alternatives]
  })
}

export const discoverUris = async (
  config: DiscoverMethodsConfigInternal,
  fetchFn?: FetchFn,
  onError?: DiscoverOnErrorFn,
): Promise<DiscoverUrisResult> => {
  const result: DiscoverUrisResult = {}

  if (config.platform) {
    const entries = await discoverUrisFromPlatform(
      config.platform.content,
      config.platform.headers,
      config.platform.options,
      fetchFn,
      onError,
    )

    if (entries.length > 0) {
      result.platform = entries
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
    const platformUris = result.platform?.flatMap((entry) => entry.uri) ?? []
    const guesses = discoverUrisFromGuess(config.guess.options)
    const handlers = config.platform?.options.handlers ?? []
    const uris = excludeGuesses(guesses, handlers, platformUris)

    if (uris.length > 0) {
      result.guess = uris.map((uri) => ({ uri }))
    }
  }

  return result
}
