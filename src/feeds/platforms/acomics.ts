import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers comic (html).
// Handler needed for: user.

export type AcomicsUrl = { kind: 'comic'; comic: string } | { kind: 'user'; username: string }

const hosts = ['acomics.ru', 'www.acomics.ru']

// A comic lives under /~{comic} and a user under /-{user}, and both keep their case in the feed
// URL, since /~oglaf/rss answers 404 where /~Oglaf/rss serves the comic.
export const parseAcomicsUrl = (url: string): AcomicsUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [first] = getPathSegments(url)

  if (!first || first.length < 2) {
    return
  }

  if (first.startsWith('~')) {
    return { kind: 'comic', comic: first.slice(1) }
  }

  if (first.startsWith('-')) {
    return { kind: 'user', username: first.slice(1) }
  }
}

export const acomicsHandler: PlatformHandler = {
  match: (url) => {
    return parseAcomicsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAcomicsUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'comic') {
      return [
        {
          uri: `https://acomics.ru/~${parsed.comic}/rss`,
          hint: composeHint('acomics:issues'),
        },
      ]
    }

    return [
      {
        uri: `https://acomics.ru/-${parsed.username}/rss`,
        hint: composeHint('acomics:subscriptions'),
      },
    ]
  },
}
