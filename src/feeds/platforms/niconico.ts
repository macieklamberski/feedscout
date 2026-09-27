import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers article, blomaga, channel, live, video.

export const hosts = ['ch.nicovideo.jp']

const channelRegex = /^[\w-]+$/

// Site routes on ch.nicovideo.jp. A channel can take a word such as `live` or `voice` as its slug.
const reservedPaths = [
  'api',
  'article',
  'channel',
  'info',
  'letter',
  'my',
  'portal',
  'search',
  'start',
  'static',
  'video',
]

export const niconicoHandler: PlatformHandler = {
  match: (url) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    const [channel] = getPathSegments(url)

    return !!channel && channelRegex.test(channel) && !isAnyOf(channel, reservedPaths)
  },

  resolve: (url) => {
    const [channel, section] = getPathSegments(url)
    const video = {
      uri: `https://ch.nicovideo.jp/${channel}/video?rss=2.0`,
      hint: composeHint('niconico:videos'),
    }
    const live = {
      uri: `https://ch.nicovideo.jp/${channel}/live?rss=2.0`,
      hint: composeHint('niconico:live'),
    }
    const blog = {
      uri: `https://ch.nicovideo.jp/${channel}/blomaga/nico/feed`,
      hint: composeHint('niconico:blog'),
    }

    if (isAnyOf(section, 'live')) {
      return [live, video, blog]
    }

    if (isAnyOf(section, 'blomaga')) {
      return [blog, video, live]
    }

    return [video, live, blog]
  },
}
