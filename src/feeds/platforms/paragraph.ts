import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ParagraphUrl = { kind: 'blog'; username: string }

const hosts = ['paragraph.com', 'www.paragraph.com']

const userRegex = /^\/@([^/]+)/

const feeds = definePlatformFeeds([
  { key: 'paragraph:blog', template: 'https://api.paragraph.com/blogs/rss/@{username}' },
  // A blog page links this one with %40, and it answers 308 to the api.paragraph.com feed.
  {
    key: 'paragraph:blog',
    template: 'https://paragraph.com/api/blogs/rss/@{username}',
    isAlias: true,
  },
])

export const parseParagraphUrl = (url: string): ParagraphUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const paragraphHandler: PlatformHandler = {
  match: (url) => {
    return parseParagraphUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseParagraphUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('paragraph:blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
