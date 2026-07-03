import { isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['audioboom.com', 'www.audioboom.com']
const channelRegex = /^\/channels\/(\d+)/

export const audioboomHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(channelRegex)

    if (!match?.[1]) {
      return []
    }

    const channelId = match[1]
    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://audioboom.com/channels/${channelId}.rss`,
      hint: composeHint('audioboom:podcast'),
    })

    return uris
  },
}
