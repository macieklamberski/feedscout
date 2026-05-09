import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.

export const posthavenHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'posthaven.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [{ uri: `${origin}/posts.atom`, hint: composeHint('posthaven:posts') }]
  },
}
