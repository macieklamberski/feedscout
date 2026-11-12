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

    if (!parsed) {
      return []
    }

    const scheme = new URL(url).protocol.slice(0, -1)

    return [feeds.getFeedEntry('mataroa:blog', { scheme, blog: parsed.blog })]
  },

  getFeedHint: feeds.getFeedHint,
}
