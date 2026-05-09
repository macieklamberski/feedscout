import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.

export const podigeeHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'podigee.io')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed/mp3`, hint: composeHint('podigee:podcast') }]
  },
}
