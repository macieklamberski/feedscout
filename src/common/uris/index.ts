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
import { resolveFromPlatform } from './platform/index.js'

// A guess is kept when no regex matches it or the platform emitted it. An entry with alternatives
// keeps the ones that pass and is dropped when none do.
const excludeGuesses = (
  guesses: Array<UriEntry>,
  regexes: Array<RegExp>,
  platformUris: Array<string>,
): Array<UriEntry> => {
  const isKept = (uri: string) => {
    return platformUris.includes(uri) || !regexes.some((regex) => regex.test(uri))
  }
  const kept: Array<UriEntry> = []

  for (const guess of guesses) {
    if (typeof guess === 'string') {
      if (isKept(guess)) {
        kept.push(guess)
      }

      continue
    }

    const alternatives = guess.filter(isKept)

    if (alternatives.length > 0) {
      kept.push(alternatives)
    }
  }

  return kept
}

export const discoverUris = async (
  config: DiscoverMethodsConfigInternal,
  fetchFn?: FetchFn,
  onError?: DiscoverOnErrorFn,
): Promise<DiscoverUrisResult> => {
  const result: DiscoverUrisResult = {}
  let guessExclusionRegexes: Array<RegExp> = []

  if (config.platform) {
    const resolution = await resolveFromPlatform(
      config.platform.content,
      config.platform.headers,
      config.platform.options,
      fetchFn,
      onError,
    )

    guessExclusionRegexes = resolution.guessExclusionRegexes

    if (resolution.entries.length > 0) {
      result.platform = resolution.entries
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
    let uris = discoverUrisFromGuess(config.guess.options)

    if (guessExclusionRegexes.length > 0) {
      const platformUris = result.platform?.flatMap((entry) => entry.uri) ?? []
      uris = excludeGuesses(uris, guessExclusionRegexes, platformUris)
    }

    if (uris.length > 0) {
      result.guess = uris.map((uri) => ({ uri }))
    }
  }

  return result
}
