import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BlogiaUrl = { kind: 'blog'; blog: string }

const domains = ['blogia.com']

const feeds = definePlatformFeeds(
  [
    { key: 'blogia:posts', template: '{scheme}://{host}/feed.xml' },
    { key: 'blogia:comments', template: '{scheme}://{host}/comentarios.xml' },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('blogia:posts'), page.getFeedEntry('blogia:comments')]
  },

  getFeedHint: feeds.getFeedHint,
}
