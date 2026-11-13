import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type AudioboomUrl =
  | { kind: 'channel'; channelId: string }
  | { kind: 'playlist'; playlistId: string }

const hosts = ['audioboom.com', 'www.audioboom.com']

const channelRegex = /^\/channels\/(?<segment>[^/]+)/i
const playlistRegex = /^\/playlists\/(?<segment>[^/]+)/i
// The page answers at /channels/{id} and at its canonical /channels/{id}-{slug}, and a playlist
// the same way.
const channelIdRegex = /^(?<channelId>\d+)(?:-|$)/

const feeds = definePlatformFeeds([
  { key: 'audioboom:podcast', template: 'https://audioboom.com/channels/{channelId}.rss' },
  { key: 'audioboom:playlist', template: 'https://audioboom.com/playlists/{playlistId}.rss' },
])

export const parseAudioboomUrl = (url: string): AudioboomUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { pathname } = new URL(url)
  const playlistSegment = pathname.match(playlistRegex)?.groups?.segment
  const playlistId = playlistSegment?.match(channelIdRegex)?.groups?.channelId

  if (playlistId) {
    return { kind: 'playlist', playlistId }
  }

  const segment = pathname.match(channelRegex)?.groups?.segment
  const channelId = segment?.match(channelIdRegex)?.groups?.channelId

  if (!channelId) {
    return
  }

  return { kind: 'channel', channelId }
}

export const audioboomHandler: PlatformHandler = {
  match: (url) => {
    return parseAudioboomUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAudioboomUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'playlist') {
      return [feeds.getFeedEntry('audioboom:playlist', { playlistId: parsed.playlistId })]
    }

    return [feeds.getFeedEntry('audioboom:podcast', { channelId: parsed.channelId })]
  },

  getFeedHint: feeds.getFeedHint,
}
