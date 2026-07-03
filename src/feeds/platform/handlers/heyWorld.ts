import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

export const heyWorldHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, 'world.hey.com')
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const username = pathSegments[0]

    return [
      {
        uri: `https://world.hey.com/${username}/feed.atom`,
        hint: composeHint('hey-world:blog'),
      },
    ]
  },
}
