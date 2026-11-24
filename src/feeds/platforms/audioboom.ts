import { audioboom } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type AudioboomUrl =
  | { kind: 'channel'; channelId: string }
  | { kind: 'playlist'; playlistId: string }

const feeds = withHintLabels(audioboom.feeds)

export const parseAudioboomUrl = (url: string): AudioboomUrl | undefined => {
  const page = audioboom.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'playlist') {
    return { kind: 'playlist', playlistId: page.params.playlistId }
  }

  return { kind: 'channel', channelId: page.params.channelId }
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
