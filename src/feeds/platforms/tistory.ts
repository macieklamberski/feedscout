import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['tistory.com']

export const tistoryHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('tistory:blog') }]
  },
}
