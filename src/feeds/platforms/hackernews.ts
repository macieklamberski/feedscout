import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, news, show (guess, html).
// Handler needed for: shownew.

export type HackernewsUrl = { kind: 'show' } | { kind: 'home' }

const hosts = ['news.ycombinator.com']

const showRegex = /^\/show(?:new)?\/?$/i

const feeds = definePlatformFeeds([
  { key: 'hackernews:front', template: 'https://news.ycombinator.com/rss' },
  { key: 'hackernews:show', template: 'https://news.ycombinator.com/showrss' },
])

export const parseHackernewsUrl = (url: string): HackernewsUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  if (showRegex.test(new URL(url).pathname)) {
    return { kind: 'show' }
  }

  return { kind: 'home' }
}

export const hackernewsHandler: PlatformHandler = {
  match: (url) => {
    return parseHackernewsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHackernewsUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'show') {
      return [feeds.getFeedEntry('hackernews:show')]
    }

    return [feeds.getFeedEntry('hackernews:front')]
  },

  getFeedHint: feeds.getFeedHint,
}
