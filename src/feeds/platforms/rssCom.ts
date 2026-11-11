import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type RssComUrl = { kind: 'podcast'; show: string }

const hosts = ['rss.com', 'www.rss.com']

// An optional locale prefix, e.g. /es/podcasts/, /it/podcasts/.
const podcastRegex = /^\/(?:[a-z]+\/)?podcasts\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'rss-com:podcast', template: 'https://media.rss.com/{show}/feed.xml' },
])

export const parseRssComUrl = (url: string): RssComUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const show = parsedUrl.pathname.match(podcastRegex)?.[1]

  if (!show) {
    return
  }

  return { kind: 'podcast', show }
}

export const rssComHandler: PlatformHandler = {
  match: (url) => {
    return parseRssComUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRssComUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('rss-com:podcast', { show: parsed.show })]
  },

  getFeedKey: feeds.getFeedKey,
}
