import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, profile (guess, html), partly covers latest.
// Handler needed for: article, tag.

export type DevtoUrl =
  | { kind: 'profile'; owner: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'latest' }
  | { kind: 'home' }

const hosts = ['dev.to', 'www.dev.to']

// An article lives under its author's name, a user or an organization: /{name}/{slug}.
const ownerRegex = /^\/([a-zA-Z0-9_-]+)(?:\/|$)/i
const tagRegex = /^\/t\/([^/]+)/i
const latestRegex = /^\/latest\/?$/i

// `/feed/latest` reads before `/feed/{owner}`, so a user named latest reads as the latest feed.
const feeds = definePlatformFeeds([
  { key: 'devto:community', template: 'https://dev.to/feed' },
  { key: 'devto:latest', template: 'https://dev.to/feed/latest' },
  { key: 'devto:tag', template: 'https://dev.to/feed/tag/{tag}' },
  { key: 'devto:posts', template: 'https://dev.to/feed/{owner}' },
])

export const parseDevtoUrl = (url: string): DevtoUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  // Homepage: global community feed.
  if (parsedUrl.pathname === '/') {
    return { kind: 'home' }
  }

  // Latest sort: /latest.
  if (latestRegex.test(parsedUrl.pathname)) {
    return { kind: 'latest' }
  }

  const tag = parsedUrl.pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const owner = parsedUrl.pathname.match(ownerRegex)?.[1]

  if (!owner) {
    return
  }

  return { kind: 'profile', owner }
}

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    return parseDevtoUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDevtoUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('devto:community')]
    }

    if (parsed.kind === 'latest') {
      return [feeds.getFeedEntry('devto:latest'), feeds.getFeedEntry('devto:community')]
    }

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('devto:tag', { tag: parsed.tag })]
    }

    return [feeds.getFeedEntry('devto:posts', { owner: parsed.owner })]
  },

  getFeedKey: feeds.getFeedKey,
}
