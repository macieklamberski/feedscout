import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Not discoverable without handler.

const domainSuffix = /\.transistor\.fm$/i

export const transistorHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'transistor.fm')
  },

  resolve: (url) => {
    const { hostname } = new URL(url)
    const slug = hostname.replace(domainSuffix, '')

    return [
      {
        uri: `https://feeds.transistor.fm/${slug}`,
        hint: composeHint('transistor:podcast'),
      },
    ]
  },
}
