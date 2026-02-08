import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

export const substackHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'substack.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed`, hint: composeHint('substack:newsletter') }]
  },
}
