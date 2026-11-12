import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BlogiaUrl = { kind: 'blog'; blog: string }

const domains = ['blogia.com']

// The blog's alternate link is always https, and http redirects to it.
const feeds = definePlatformFeeds([
  { key: 'blogia:posts', template: 'https://{blog}.blogia.com/feed.xml' },
])

export const parseBlogiaUrl = (url: string): BlogiaUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const blogiaHandler: PlatformHandler = {
  match: (url) => {
    return parseBlogiaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlogiaUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('blogia:posts', { blog: parsed.blog })]
  },

  getFeedHint: feeds.getFeedHint,
}
