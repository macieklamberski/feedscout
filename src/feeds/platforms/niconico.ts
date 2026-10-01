import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers article, blomaga, channel, live, video.

export type NiconicoUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'live'; channel: string }
  | { kind: 'blomaga'; channel: string }

export const hosts = ['ch.nicovideo.jp']

const channelRegex = /^[\w-]+$/

// Site routes on ch.nicovideo.jp. A channel can take a word such as `live` or `voice` as its slug.
const excludedPaths = [
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

export const parseNiconicoUrl = (url: string): NiconicoUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [channel, section] = getPathSegments(url)

  if (!channel || !channelRegex.test(channel) || isAnyOf(channel, excludedPaths)) {
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

    const video = {
      uri: `https://ch.nicovideo.jp/${parsed.channel}/video?rss=2.0`,
      hint: composeHint('niconico:videos'),
    }
    const live = {
      uri: `https://ch.nicovideo.jp/${parsed.channel}/live?rss=2.0`,
      hint: composeHint('niconico:live'),
    }
    const blog = {
      uri: `https://ch.nicovideo.jp/${parsed.channel}/blomaga/nico/feed`,
      hint: composeHint('niconico:blog'),
    }

    if (parsed.kind === 'live') {
      return [live, video, blog]
    }

    if (parsed.kind === 'blomaga') {
      return [blog, video, live]
    }

    return [video, live, blog]
  },
}
