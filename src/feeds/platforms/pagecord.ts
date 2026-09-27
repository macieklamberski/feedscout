import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['pagecord.com']
const excludedHosts = ['www.pagecord.com']

export const pagecordHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains) && !isHostOf(url, excludedHosts)
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed.xml`, hint: composeHint('pagecord:blog') }]
  },
}
