import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'

export const substackHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'substack.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [`${origin}/feed`]
  },
}
