import { getAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers comments, domain, home, newest, tag, top (guess, html).
// Handler needed for: user.

export type LobstersUrl =
  | { kind: 'tag'; tags: string }
  | { kind: 'domain'; domain: string }
  | { kind: 'user'; username: string }
  | { kind: 'top'; period?: string }
  | { kind: 'newest' }
  | { kind: 'comments' }
  | { kind: 'home' }

const hosts = ['lobste.rs']
const tagRegex = /^\/t\/([a-zA-Z0-9,_-]+)/i
const domainRegex = /^\/domains\/([^/]+)/i
const userRegex = /^\/~([a-zA-Z0-9_-]+)/i
const topRegex = /^\/top(?:\/(1d|3d|1w|1m|1y))?\/?$/i
const newestRegex = /^\/newest\/?$/i
const commentsRegex = /^\/comments\/?$/i

const topPeriods = ['1d', '3d', '1w', '1m', '1y']

export const parseLobstersUrl = (url: string): LobstersUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  // A comma joins several tags: /t/{tag1},{tag2}.
  const tags = pathname.match(tagRegex)?.[1]

  if (tags) {
    return { kind: 'tag', tags }
  }

  const domain = pathname.match(domainRegex)?.[1]

  if (domain) {
    return { kind: 'domain', domain }
  }

  const username = pathname.match(userRegex)?.[1]

  if (username) {
    return { kind: 'user', username }
  }

  const topMatch = pathname.match(topRegex)

  // Top page, all time or for a period: /top or /top/{period}.
  if (topMatch) {
    return { kind: 'top', period: getAnyOf(topMatch[1], topPeriods) }
  }

  if (newestRegex.test(pathname)) {
    return { kind: 'newest' }
  }

  if (commentsRegex.test(pathname)) {
    return { kind: 'comments' }
  }

  return { kind: 'home' }
}

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return parseLobstersUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLobstersUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [{ uri: `https://lobste.rs/t/${parsed.tags}.rss`, hint: composeHint('lobsters:tag') }]
    }

    if (parsed.kind === 'domain') {
      return [
        {
          uri: `https://lobste.rs/domains/${parsed.domain}.rss`,
          hint: composeHint('lobsters:domain'),
        },
      ]
    }

    if (parsed.kind === 'user') {
      return [
        {
          uri: `https://lobste.rs/~${parsed.username}/stories.rss`,
          hint: composeHint('lobsters:stories'),
        },
      ]
    }

    if (parsed.kind === 'top' && parsed.period) {
      return [
        {
          uri: `https://lobste.rs/top/${parsed.period}/rss`,
          hint: composeHint('lobsters:top'),
        },
      ]
    }

    if (parsed.kind === 'top') {
      return [{ uri: 'https://lobste.rs/top/rss', hint: composeHint('lobsters:top') }]
    }

    if (parsed.kind === 'newest') {
      return [{ uri: 'https://lobste.rs/newest.rss', hint: composeHint('lobsters:newest') }]
    }

    if (parsed.kind === 'comments') {
      return [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: composeHint('lobsters:comments'),
        },
      ]
    }

    return [
      { uri: 'https://lobste.rs/rss', hint: composeHint('lobsters:stories') },
      { uri: 'https://lobste.rs/comments.rss', hint: composeHint('lobsters:comments') },
    ]
  },
}
