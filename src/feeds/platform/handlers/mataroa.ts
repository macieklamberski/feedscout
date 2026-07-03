import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

export const mataroaHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'mataroa.blog')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss/`, hint: composeHint('mataroa:blog') }]
  },
}
