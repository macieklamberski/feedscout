import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PagecordUrl = { kind: 'blog' }

const domains = ['pagecord.com']
const excludedHosts = ['www.pagecord.com']

export const parsePagecordUrl = (url: string): PagecordUrl | undefined => {
  if (!isSubdomainOf(url, domains) || isHostOf(url, excludedHosts)) {
    return
  }

  return { kind: 'blog' }
}

export const pagecordHandler: PlatformHandler = {
  match: (url) => {
    return parsePagecordUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePagecordUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed.xml`, hint: composeHint('pagecord:blog') }]
  },
}
