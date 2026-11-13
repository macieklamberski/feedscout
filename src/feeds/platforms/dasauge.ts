import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers portfolio, profile.

export type DasaugeUrl = { kind: 'home' }

// dasauge's country domains.
const hosts = [/^dasauge\.(?:at|ch|co\.uk|com|de|es)$/]

// The 2026-10-26 relaunch removed the profile feed: `/-{username}?rss` serves the profile page.
// Its row stays so a stored profile feed is still claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'dasauge:news', template: '{scheme}://{host}/news/feed', format: 'atom' },
    { key: 'dasauge:jobs', template: '{scheme}://{host}/jobs/feed', format: 'atom' },
    { key: 'dasauge:workspaces', template: '{scheme}://{host}/workspaces/feed', format: 'atom' },
    { key: 'dasauge:profile', template: '{scheme}://{host}/-{username}/?rss' },
  ],
  { hosts },
)

export const parseDasaugeUrl = (url: string): DasaugeUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  return { kind: 'home' }
}

export const dasaugeHandler: PlatformHandler = {
  match: (url) => {
    return parseDasaugeUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!parseDasaugeUrl(url) || !page) {
      return []
    }

    return [
      page.getFeedEntry('dasauge:news', {}, 'atom'),
      page.getFeedEntry('dasauge:jobs', {}, 'atom'),
      page.getFeedEntry('dasauge:workspaces', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
