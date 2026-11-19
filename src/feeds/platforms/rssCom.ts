import { rssCom } from 'feedintel'
import { isHostOf, isLocale, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type RssComUrl = { kind: 'podcast'; show: string }

const hosts = rssCom.hosts.exact

// An optional locale prefix, e.g. /es/podcasts/, /it/podcasts/.
const podcastRegex = /^\/(?:([^/]+)\/)?podcasts\/([^/]+)/i

const feeds = withHintLabels(rssCom.feeds)

export const parseRssComUrl = (url: string): RssComUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [, locale, show] = parsedUrl.pathname.match(podcastRegex) ?? []

  if (!show || (locale && !isLocale(locale))) {
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

    return [feeds.getFeedEntry('podcast', { show: parsed.show })]
  },

  getFeedHint: feeds.getFeedHint,
}
