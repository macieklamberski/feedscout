import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

const profileRegex = /^\/@([\w-]+)/

export const substackHandler: PlatformHandler = {
  match: (url) => {
    if (isSubdomainOf(url, 'substack.com')) {
      return true
    }

    return isHostOf(url, 'substack.com') && profileRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    const parsed = new URL(url)
    const profileMatch = parsed.pathname.match(profileRegex)

    if (isHostOf(url, 'substack.com') && profileMatch?.[1]) {
      return [
        {
          uri: `https://${profileMatch[1]}.substack.com/feed`,
          hint: composeHint('substack:newsletter'),
        },
      ]
    }

    return [{ uri: `${parsed.origin}/feed`, hint: composeHint('substack:newsletter') }]
  },
}
