import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

export const pagecordHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'pagecord.com') && !isHostOf(url, 'www.pagecord.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed.xml`, hint: composeHint('pagecord:blog') }]
  },
}
