import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Not discoverable without handler.

const hosts = ['odysee.com', 'www.odysee.com']
const channelRegex = /^\/(@[^/:]+:[a-f0-9]+)/i

export const odyseeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(channelRegex)

    if (!match?.[1]) {
      return []
    }

    return [
      {
        uri: `https://odysee.com/$/rss/${match[1]}`,
        hint: composeHint('odysee:videos'),
      },
    ]
  },
}
