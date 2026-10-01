import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HashnodeUrl = { kind: 'blog' }

const domains = ['hashnode.dev', 'hashnode.com']

export const parseHashnodeUrl = (url: string): HashnodeUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const hashnodeHandler: PlatformHandler = {
  match: (url) => {
    return parseHashnodeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHashnodeUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss.xml`, hint: composeHint('hashnode:blog') }]
  },
}
