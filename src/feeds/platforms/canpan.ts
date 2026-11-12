import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type CanpanUrl = { kind: 'blog'; blog: string }

const hosts = ['blog.canpan.info']

const feeds = definePlatformFeeds([
  { key: 'canpan:posts', template: 'https://blog.canpan.info/{blog}/index2_0.xml', format: 'rss' },
  { key: 'canpan:posts', template: 'https://blog.canpan.info/{blog}/index1_0.rdf', format: 'rdf' },
])

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
      feeds.getFeedEntry('canpan:posts', { blog: parsed.blog }, 'rss'),
      feeds.getFeedEntry('canpan:posts', { blog: parsed.blog }, 'rdf'),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}
