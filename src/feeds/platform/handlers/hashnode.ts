import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

export const hashnodeHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'hashnode.dev')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss.xml`, hint: composeHint('hashnode:blog') }]
  },
}
