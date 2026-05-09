import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.
//
// {slug}.podbean.com/feed.xml also works but 302-redirects to feed.podbean.com.

const domainSuffix = /\.podbean\.com$/i

export const podbeanHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'podbean.com')
  },

  resolve: (url) => {
    const { hostname } = new URL(url)
    const slug = hostname.replace(domainSuffix, '')

    return [
      {
        uri: `https://feed.podbean.com/${slug}/feed.xml`,
        hint: composeHint('podbean:podcast'),
      },
    ]
  },
}
