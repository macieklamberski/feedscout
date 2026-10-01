import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ProducthuntUrl = { kind: 'home' }

export const hosts = ['producthunt.com', 'www.producthunt.com']

// Every page links the site-wide product feed.
export const parseProducthuntUrl = (url: string): ProducthuntUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  return { kind: 'home' }
}

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    return parseProducthuntUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseProducthuntUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: 'https://www.producthunt.com/feed',
        hint: composeHint('producthunt:products'),
      },
    ]
  },
}
