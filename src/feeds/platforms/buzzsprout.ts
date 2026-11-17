import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BuzzsproutUrl = { kind: 'podcast'; podcastId: string }

const hosts = ['buzzsprout.com', 'www.buzzsprout.com']

const feeds = definePlatformFeeds('buzzsprout', [
  {
    key: 'podcast',
    main: 'https://rss.buzzsprout.com/{podcastId}.rss',
    aliases: [
      // Served spellings, which redirect to the one above. Claimed, never built.
      'https://feeds.buzzsprout.com/{podcastId}.rss',
      'https://buzzsprout.com/{podcastId}.rss',
    ],
  },
])

export const parseBuzzsproutUrl = (url: string): BuzzsproutUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [podcastId] = getPathSegments(url)

  if (!podcastId || !digitsRegex.test(podcastId)) {
    return
  }

  return { kind: 'podcast', podcastId }
}

export const buzzsproutHandler: PlatformHandler = {
  match: (url) => {
    return parseBuzzsproutUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBuzzsproutUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { podcastId: parsed.podcastId })]
  },

  getFeedHint: feeds.getFeedHint,
}
