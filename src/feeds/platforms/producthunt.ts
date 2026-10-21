import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ProducthuntUrl =
  | { kind: 'product'; slug: string }
  | { kind: 'topic'; topic: string }
  | { kind: 'home' }

export const hosts = ['producthunt.com', 'www.producthunt.com']

const productRegex = /^\/products\/([^/]+)(?:\/|$)/i
const topicRegex = /^\/topics\/([^/]+)\/?$/i

// Every page links the site-wide product feed, so any other page reads as the home page.
export const parseProducthuntUrl = (url: string): ProducthuntUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const slug = parsedUrl.pathname.match(productRegex)?.[1]

  if (slug) {
    return { kind: 'product', slug }
  }

  const topic = parsedUrl.pathname.match(topicRegex)?.[1]

  if (topic) {
    return { kind: 'topic', topic }
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
