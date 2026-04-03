import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf, isSubdomainOf } from '../../../common/utils.js'

const profilePattern = /^\/@([\w-]+)/

export const substackHandler: PlatformHandler = {
  match: (url) => {
    if (isSubdomainOf(url, 'substack.com')) {
      return true
    }

    try {
      return isHostOf(url, 'substack.com') && profilePattern.test(new URL(url).pathname)
    } catch {}

    return false
  },

  resolve: (url) => {
    const parsed = new URL(url)

    if (isHostOf(url, 'substack.com')) {
      const match = parsed.pathname.match(profilePattern)

      if (match?.[1]) {
        return [
          {
            uri: `https://${match[1]}.substack.com/feed`,
            hint: composeHint('substack:newsletter'),
          },
        ]
      }
    }

    return [{ uri: `${parsed.origin}/feed`, hint: composeHint('substack:newsletter') }]
  },
}
