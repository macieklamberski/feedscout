import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type MataroaUrl = { kind: 'blog'; blog: string }

const domains = ['mataroa.blog']

const feeds = definePlatformFeeds([
  { key: 'mataroa:blog', template: '{scheme}://{blog}.mataroa.blog/rss/' },
])

export const parseMataroaUrl = (url: string): MataroaUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const mataroaHandler: PlatformHandler = {
  match: (url) => {
    return parseMataroaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMataroaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('mataroa:blog', { blog: parsed.blog })]
  },

  getFeedHint: feeds.getFeedHint,
}
