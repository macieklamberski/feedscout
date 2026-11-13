import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type DasaugeUrl = { kind: 'profile'; username: string }

// dasauge's country domains.
const hosts = [/^dasauge\.(?:at|ch|co\.uk|com|de|es)$/]

const profileRegex = /^-(.+)$/

// The feed is the `rss` query with no value, linked as `?rss`. A stored copy of a `?rss=` URL is
// the same RSS feed, so `?rss=` serves it too.
const feeds = definePlatformFeeds(
  [{ key: 'dasauge:profile', template: 'https://{host}/-{username}/?rss' }],
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
    const host = parseUrl(url)?.hostname

    if (!parsed || !host) {
      return []
    }

    // The site redirects http to https.
    return [feeds.getFeedEntry('dasauge:profile', { host, username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
