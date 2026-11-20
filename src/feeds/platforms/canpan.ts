import { canpan } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler adds formats for: posts (rss).

export type CanpanUrl = { kind: 'blog'; blog: string }

const hosts = canpan.hosts.exact

const feeds = withHintLabels(canpan.feeds)

export const parseCanpanUrl = (url: string): CanpanUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [blog] = getPathSegments(url)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const canpanHandler: PlatformHandler = {
  match: (url) => {
    return parseCanpanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCanpanUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('posts', { blog: parsed.blog }, 'rss'),
      feeds.getFeedEntry('posts', { blog: parsed.blog }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
