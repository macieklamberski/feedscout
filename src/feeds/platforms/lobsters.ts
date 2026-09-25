import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers comments, domain, home, newest, tag, top (guess, html).
// Handler needed for: user.

export type LobstersUrl =
  | { kind: 'tag'; tags: string }
  | { kind: 'domain'; domain: string }
  | { kind: 'user'; username: string }

const hosts = ['lobste.rs']
const tagRegex = /^\/t\/([a-zA-Z0-9,_-]+)/
const domainRegex = /^\/domains\/([^/]+)/
const userRegex = /^\/~([a-zA-Z0-9_-]+)/
const topRegex = /^\/top(?:\/(1d|3d|1w|1m|1y))?\/?$/

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
}

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const parsed = parseLobstersUrl(url)

    if (parsed?.kind === 'tag') {
      return [{ uri: `https://lobste.rs/t/${parsed.tags}.rss`, hint: composeHint('lobsters:tag') }]
    }

    if (parsed?.kind === 'domain') {
      return [
        {
          uri: `https://lobste.rs/domains/${parsed.domain}.rss`,
          hint: composeHint('lobsters:domain'),
        },
      ]
    }

    if (parsed?.kind === 'user') {
      return [
        {
          uri: `https://lobste.rs/~${parsed.username}/stories.rss`,
          hint: composeHint('lobsters:stories'),
        },
      ]
    }

    const topMatch = pathname.match(topRegex)

    // Top page, all time or for a period: /top or /top/{period}.
    if (topMatch) {
      const [, period] = topMatch

      if (period) {
        return [
          {
            uri: `https://lobste.rs/top/${period}/rss`,
            hint: composeHint('lobsters:top'),
          },
        ]
      }

      return [{ uri: 'https://lobste.rs/top/rss', hint: composeHint('lobsters:top') }]
    }

    // Newest page.
    if (pathname === '/newest' || pathname === '/newest/') {
      return [{ uri: 'https://lobste.rs/newest.rss', hint: composeHint('lobsters:newest') }]
    }

    // Comments page.
    if (pathname === '/comments' || pathname === '/comments/') {
      return [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: composeHint('lobsters:comments'),
        },
      ]
    }

    // Homepage or other pages - return main feed.
    return [
      { uri: 'https://lobste.rs/rss', hint: composeHint('lobsters:stories') },
      { uri: 'https://lobste.rs/comments.rss', hint: composeHint('lobsters:comments') },
    ]
  },
}
