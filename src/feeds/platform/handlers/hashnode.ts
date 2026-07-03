import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

export const hashnodeHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, ['hashnode.dev', 'hashnode.com'])
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss.xml`, hint: composeHint('hashnode:blog') }]
  },
}
