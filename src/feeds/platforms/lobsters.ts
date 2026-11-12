import { hasQueryParam, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers comments, domain, home, multiTag, newest, tag, top (guess, html).
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

const tagRegex = /^\/t\/(?<tags>[^/]+)/i
const domainRegex = /^\/domains\/([^/]+)/i
const userRegex = /^\/~(?<username>[^/]+)/
const topRegex = /^\/top(?:\/(?<period>\d+[dwmy]))?\/?$/i
const newestRegex = /^\/newest\/?$/i
const commentsRegex = /^\/comments\/?$/i
const tagsValueRegex = /^[\w,-]+$/

// A top page links its feed as /top/{period}.rss, which /top/{period}/rss redirects to.
const feeds = definePlatformFeeds([
  { key: 'lobsters:tag', template: 'https://lobste.rs/t/{tags}.rss' },
  { key: 'lobsters:domain', template: 'https://lobste.rs/domains/{domain}.rss' },
  { key: 'lobsters:stories', template: 'https://lobste.rs/~{username}/stories.rss' },
  { key: 'lobsters:stories', template: 'https://lobste.rs/rss' },
  { key: 'lobsters:top', template: 'https://lobste.rs/top/{period}/rss' },
  { key: 'lobsters:top', template: 'https://lobste.rs/top/{period}.rss' },
  { key: 'lobsters:top', template: 'https://lobste.rs/top/rss' },
  { key: 'lobsters:newest', template: 'https://lobste.rs/newest.rss' },
  { key: 'lobsters:comments', template: 'https://lobste.rs/comments.rss' },
])

export const parseLobstersUrl = (url: string): LobstersUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  // A comma joins several tags: /t/{tag1},{tag2}.
  const tags = pathname.match(tagRegex)?.groups?.tags

  if (tags && tagsValueRegex.test(tags)) {
    return { kind: 'tag', tags }
  }

  const domain = pathname.match(domainRegex)?.[1]

  if (domain) {
    return { kind: 'domain', domain }
  }

  const username = pathname.match(userRegex)?.groups?.username

  if (username && wordOrHyphenRegex.test(username)) {
    return { kind: 'user', username }
  }

  const topMatch = pathname.match(topRegex)

  // Top page, all time or for a period: /top or /top/{period}.
  if (topMatch) {
    return { kind: 'top', period: topMatch.groups?.period }
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
      return [feeds.getFeedEntry('lobsters:tag', { tags: parsed.tags })]
    }

    if (parsed.kind === 'domain') {
      return [feeds.getFeedEntry('lobsters:domain', { domain: parsed.domain })]
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('lobsters:stories', { username: parsed.username })]
    }

    if (parsed.kind === 'top' && parsed.period) {
      return [feeds.getFeedEntry('lobsters:top', { period: parsed.period })]
    }

    if (parsed.kind === 'top') {
      return [feeds.getFeedEntry('lobsters:top')]
    }

    if (parsed.kind === 'newest') {
      return [feeds.getFeedEntry('lobsters:newest')]
    }

    if (parsed.kind === 'comments') {
      return [feeds.getFeedEntry('lobsters:comments')]
    }

    return [feeds.getFeedEntry('lobsters:stories'), feeds.getFeedEntry('lobsters:comments')]
  },

  // A token feed is the reader's private feed, filtered by their settings, not the site feed.
  getFeedKey: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || hasQueryParam(parsedUrl, 'token')) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
