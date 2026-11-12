import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TwodayUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'topic'; blog: string; topic: string }

const domains = ['twoday.net']

const topicRegex = /^\/topics\/([^/]+)(?:\/|$)/i

// A blog's skin links its posts feed as `/index.rdf` or `/rss`, the same stories. Some skins
// also serve them as `/summary.rdf`, with shorter text.
const feeds = definePlatformFeeds([
  { key: 'twoday:posts', template: 'https://{blog}.twoday.net/index.rdf' },
  { key: 'twoday:posts', template: 'https://{blog}.twoday.net/rss' },
  { key: 'twoday:posts', template: 'https://{blog}.twoday.net/summary.rdf' },
  { key: 'twoday:topic', template: 'https://{blog}.twoday.net/topics/{topic}/index.rdf' },
])

export const parseTwodayUrl = (url: string): TwodayUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  const topic = pathname.match(topicRegex)?.[1]

  if (topic) {
    return { kind: 'topic', blog, topic }
  }

  return { kind: 'blog', blog }
}

export const twodayHandler: PlatformHandler = {
  match: (url) => {
    return parseTwodayUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTwodayUrl(url)

    if (!parsed) {
      return []
    }

    const posts = feeds.getFeedEntry('twoday:posts', { blog: parsed.blog })

    if (parsed.kind === 'topic') {
      const { blog, topic } = parsed

      return [feeds.getFeedEntry('twoday:topic', { blog, topic }), posts]
    }

    return [posts]
  },

  getFeedKey: feeds.getFeedKey,
}
