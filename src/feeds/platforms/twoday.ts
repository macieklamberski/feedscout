import { twoday } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts, topic.
// Handler needed for: commented, summary.

export type TwodayUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'topic'; blog: string; topic: string }

const domains = twoday.hosts.tenants

const topicRegex = /^\/topics\/([^/]+)(?:\/|$)/i

const feeds = withHintLabels(twoday.feeds)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'topic') {
      return [
        page.getFeedEntry('topic', { topic: parsed.topic }),
        page.getFeedEntry('posts'),
        page.getFeedEntry('summary'),
        page.getFeedEntry('comments'),
        page.getFeedEntry('commented'),
      ]
    }

    return [
      page.getFeedEntry('posts'),
      page.getFeedEntry('summary'),
      page.getFeedEntry('comments'),
      page.getFeedEntry('commented'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
