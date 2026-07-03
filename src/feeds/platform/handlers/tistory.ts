import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Not discoverable without handler.

export const tistoryHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'tistory.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('tistory:blog') }]
  },
}
