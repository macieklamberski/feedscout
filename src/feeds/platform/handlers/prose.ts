import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Partially discoverable without handler.

export const proseHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'prose.sh')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('prose:blog') }]
  },
}
