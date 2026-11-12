import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers article, blomaga, channel, live, video.

export type NiconicoUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'live'; channel: string }
  | { kind: 'blomaga'; channel: string }

export const hosts = ['ch.nicovideo.jp']

const feeds = definePlatformFeeds([
  { key: 'niconico:videos', template: 'https://ch.nicovideo.jp/{channel}/video?rss=2.0' },
  { key: 'niconico:live', template: 'https://ch.nicovideo.jp/{channel}/live?rss=2.0' },
  { key: 'niconico:blog', template: 'https://ch.nicovideo.jp/{channel}/blomaga/nico/feed' },
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
    const video = feeds.getFeedEntry('niconico:videos', params)
    const live = feeds.getFeedEntry('niconico:live', params)
    const blog = feeds.getFeedEntry('niconico:blog', params)

    if (parsed.kind === 'live') {
      return [live, video, blog]
    }

    if (parsed.kind === 'blomaga') {
      return [blog, video, live]
    }

    return [video, live, blog]
  },

  getFeedHint: feeds.getFeedHint,
}
