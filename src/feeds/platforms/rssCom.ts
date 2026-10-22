import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type RssComUrl = { kind: 'podcast'; show: string }

const hosts = ['rss.com', 'www.rss.com']
// Optional 2-letter locale prefix, e.g. /es/podcasts/, /it/podcasts/.
const podcastRegex = /^\/(?:[a-z]{2}\/)?podcasts\/([^/]+)/i

export const parseRssComUrl = (url: string): RssComUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const show = parsedUrl.pathname.match(podcastRegex)?.[1]

  if (!show) {
    return
  }

  // media.rss.com answers 404 for a show slug in uppercase.
  return { kind: 'podcast', show: show.toLowerCase() }
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

    return [
      {
        uri: `https://media.rss.com/${parsed.show}/feed.xml`,
        hint: composeHint('rss-com:podcast'),
      },
    ]
  },
}
