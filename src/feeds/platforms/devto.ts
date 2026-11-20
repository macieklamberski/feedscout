import { devto } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: community.
// Handler needed for: latest, posts, tag.

export type DevtoUrl =
  | { kind: 'profile'; owner: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'latest' }
  | { kind: 'home' }

const hosts = devto.hosts.exact

// An article lives under its author's name, a user or an organization: /{name}/{slug}.
const ownerRegex = /^\/([a-zA-Z0-9_-]+)(?:\/|$)/i
const tagRegex = /^\/t\/([^/]+)/i
const latestRegex = /^\/latest\/?$/i

const feeds = withHintLabels(devto.feeds)

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

    // The community and latest feeds need no value from the page, so every page builds them after
    // its own feeds.
    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('community'), feeds.getFeedEntry('latest')]
    }

    if (parsed.kind === 'latest') {
      return [feeds.getFeedEntry('latest'), feeds.getFeedEntry('community')]
    }

    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tag: parsed.tag }),
        feeds.getFeedEntry('community'),
        feeds.getFeedEntry('latest'),
      ]
    }

    return [
      feeds.getFeedEntry('posts', { owner: parsed.owner }),
      feeds.getFeedEntry('community'),
      feeds.getFeedEntry('latest'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
