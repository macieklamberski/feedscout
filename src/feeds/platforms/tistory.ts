import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TistoryUrl = { kind: 'blog' }

const domains = ['tistory.com']

export const parseTistoryUrl = (url: string): TistoryUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const tistoryHandler: PlatformHandler = {
  match: (url) => {
    return parseTistoryUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTistoryUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('tistory:blog') }]
  },
}
