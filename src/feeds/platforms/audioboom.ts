import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type AudioboomUrl = { kind: 'channel'; channelId: string }

const hosts = ['audioboom.com', 'www.audioboom.com']
const channelRegex = /^\/channels\/(\d+)/i

export const parseAudioboomUrl = (url: string): AudioboomUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const channelId = new URL(url).pathname.match(channelRegex)?.[1]

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

    return [
      {
        uri: `https://audioboom.com/channels/${parsed.channelId}.rss`,
        hint: composeHint('audioboom:podcast'),
      },
    ]
  },
}
