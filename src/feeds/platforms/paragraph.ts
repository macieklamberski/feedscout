import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ParagraphUrl = { kind: 'blog'; username: string }

const hosts = ['paragraph.com', 'www.paragraph.com']

const userRegex = /^\/@([^/]+)/

// A blog page links `/@{username}/rss.xml`, and `/feed` and `/rss` answer 308 to it. The
// api.paragraph.com feed holds the same posts under other guids, and `/api/blogs/rss/` answers 308
// to the linked feed.
const feeds = definePlatformFeeds([
  {
    key: 'paragraph:blog',
    main: 'https://paragraph.com/@{username}/rss.xml',
    aliases: [
      'https://paragraph.com/@{username}/feed',
      'https://paragraph.com/@{username}/rss',
      'https://paragraph.com/api/blogs/rss/@{username}',
    ],
  },
  { key: 'paragraph:blog', main: 'https://api.paragraph.com/blogs/rss/@{username}' },
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
