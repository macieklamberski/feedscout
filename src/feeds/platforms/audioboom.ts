import { audioboom } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type AudioboomUrl =
  | { kind: 'channel'; channelId: string }
  | { kind: 'playlist'; playlistId: string }

const hosts = audioboom.hosts.exact

const channelRegex = /^\/channels\/(?<segment>[^/]+)/i
const playlistRegex = /^\/playlists\/(?<segment>[^/]+)/i
// The page answers at /channels/{id} and at its canonical /channels/{id}-{slug}, and a playlist
// the same way.
const idRegex = /^(?<id>\d+)(?:-|$)/

const feeds = withHintLabels(audioboom.feeds)

export const parseAudioboomUrl = (url: string): AudioboomUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const playlistSegment = pathname.match(playlistRegex)?.groups?.segment
  const playlistId = playlistSegment?.match(idRegex)?.groups?.id

  if (playlistId) {
    return { kind: 'playlist', playlistId }
  }

  const segment = pathname.match(channelRegex)?.groups?.segment
  const channelId = segment?.match(idRegex)?.groups?.id

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
      return [feeds.getFeedEntry('playlist', { playlistId: parsed.playlistId })]
    }

    return [feeds.getFeedEntry('podcast', { channelId: parsed.channelId })]
  },

  getFeedHint: feeds.getFeedHint,
}
