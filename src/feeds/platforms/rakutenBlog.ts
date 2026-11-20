import { rakutenBlog } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type RakutenBlogUrl = { kind: 'blog'; username: string }

const hosts = rakutenBlog.hosts.exact

const feeds = withHintLabels(rakutenBlog.feeds)

export const parseRakutenBlogUrl = (url: string): RakutenBlogUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  // Rakuten blog names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  return { kind: 'blog', username }
}

export const rakutenBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseRakutenBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRakutenBlogUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('posts', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
