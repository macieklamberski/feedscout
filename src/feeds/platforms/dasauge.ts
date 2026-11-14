import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getBrandDomainRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type DasaugeUrl = { kind: 'profile'; username: string }

const hosts = [getBrandDomainRegex('dasauge')]

const profileRegex = /^-(.+)$/

// The feed is the `rss` query with no value, linked as `?rss`. A stored copy of a `?rss=` URL is
// the same RSS feed, so `?rss=` serves it too.
const feeds = definePlatformFeeds(
  [{ key: 'dasauge:profile', template: '{scheme}://{host}/-{username}/?rss' }],
  { hosts },
)

export const parseDasaugeUrl = (url: string): DasaugeUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [segment] = getPathSegments(url)
  const username = segment?.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const dasaugeHandler: PlatformHandler = {
  match: (url) => {
    return parseDasaugeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDasaugeUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('dasauge:profile', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
