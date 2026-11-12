import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type AtwikiUrl = { kind: 'wiki'; wiki: string }

// Legacy wwwNN.atwiki.jp hosts redirect every wiki path to w.atwiki.jp.
const hosts = ['w.atwiki.jp']

// The wiki also serves its rss10.xml at /rss, a spelling feeds are stored under but never built.
const feeds = definePlatformFeeds([
  {
    key: 'atwiki:updated-pages',
    template: 'https://w.atwiki.jp/{wiki}/rss10.xml',
    format: 'rdf',
  },
  { key: 'atwiki:updated-pages', template: 'https://w.atwiki.jp/{wiki}/rss', format: 'rdf' },
  {
    key: 'atwiki:updated-pages',
    template: 'https://w.atwiki.jp/{wiki}/feed.atom',
    format: 'atom',
  },
  {
    key: 'atwiki:new-pages',
    template: 'https://w.atwiki.jp/{wiki}/rss10_new.xml',
    format: 'rdf',
  },
])

export const parseAtwikiUrl = (url: string): AtwikiUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [wiki] = getPathSegments(url)

  if (!wiki) {
    return
  }

  return { kind: 'wiki', wiki }
}

export const atwikiHandler: PlatformHandler = {
  match: (url) => {
    return parseAtwikiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAtwikiUrl(url)

    if (!parsed) {
      return []
    }

    const { wiki } = parsed

    return [
      feeds.getFeedEntry('atwiki:updated-pages', { wiki }, 'rdf'),
      feeds.getFeedEntry('atwiki:updated-pages', { wiki }, 'atom'),
      feeds.getFeedEntry('atwiki:new-pages', { wiki }, 'rdf'),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}
