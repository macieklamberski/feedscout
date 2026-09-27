import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const domains = ['hashnode.dev', 'hashnode.com']

export const hashnodeHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss.xml`, hint: composeHint('hashnode:blog') }]
  },
}
