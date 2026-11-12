import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ProducthuntUrl =
  | { kind: 'product'; slug: string }
  | { kind: 'topic'; topic: string }
  | { kind: 'category'; category: string }
  | { kind: 'home' }

export const hosts = ['producthunt.com', 'www.producthunt.com']

const productRegex = /^\/products\/([^/]+)(?:\/|$)/i
const topicRegex = /^\/topics\/([^/]+)\/?$/i
const categoryRegex = /^\/categories\/([^/]+)\/?$/i

const feeds = definePlatformFeeds([
  { key: 'producthunt:products', template: 'https://www.producthunt.com/feed' },
  { key: 'producthunt:category', template: 'https://www.producthunt.com/feed?category={category}' },
])

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

  const category = parsedUrl.pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', category }
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

    // The category page answers plain requests with a challenge, so its feed is built from the URL.
    if (parsed.kind === 'category') {
      return [
        feeds.getFeedEntry('producthunt:category', { category: parsed.category }),
        feeds.getFeedEntry('producthunt:products'),
      ]
    }

    return [feeds.getFeedEntry('producthunt:products')]
  },

  getFeedHint: feeds.getFeedHint,
}
