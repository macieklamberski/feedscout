import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['producthunt.com', 'www.producthunt.com']

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: () => {
    return [
      {
        uri: 'https://www.producthunt.com/feed',
        hint: composeHint('producthunt:products'),
      },
    ]
  },
}
