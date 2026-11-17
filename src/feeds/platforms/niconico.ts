import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: blog, live, videos.

export type NiconicoUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'live'; channel: string }
  | { kind: 'blomaga'; channel: string }

export const hosts = ['ch.nicovideo.jp']

const feeds = definePlatformFeeds('niconico', [
  { key: 'videos', main: 'https://ch.nicovideo.jp/{channel}/video?rss=2.0' },
  { key: 'live', main: 'https://ch.nicovideo.jp/{channel}/live?rss=2.0' },
  { key: 'blog', main: 'https://ch.nicovideo.jp/{channel}/blomaga/nico/feed' },
])

export const parseNiconicoUrl = (url: string): NiconicoUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [channel, section] = getPathSegments(url)

  if (!channel || !wordOrHyphenRegex.test(channel)) {
    return
  }

  if (isAnyOf(section, 'live')) {
    return { kind: 'live', channel }
  }

  if (isAnyOf(section, 'blomaga')) {
    return { kind: 'blomaga', channel }
  }

  return { kind: 'channel', channel }
}

export const niconicoHandler: PlatformHandler = {
  match: (url) => {
    return parseNiconicoUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNiconicoUrl(url)

    if (!parsed) {
      return []
    }

    const params = { channel: parsed.channel }

    if (parsed.kind === 'live') {
      return [
        feeds.getFeedEntry('live', params),
        feeds.getFeedEntry('videos', params),
        feeds.getFeedEntry('blog', params),
      ]
    }

    if (parsed.kind === 'blomaga') {
      return [
        feeds.getFeedEntry('blog', params),
        feeds.getFeedEntry('videos', params),
        feeds.getFeedEntry('live', params),
      ]
    }

    return [
      feeds.getFeedEntry('videos', params),
      feeds.getFeedEntry('live', params),
      feeds.getFeedEntry('blog', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
