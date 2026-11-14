import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ParagraphUrl = { kind: 'blog'; username: string }

const hosts = ['paragraph.com', 'www.paragraph.com']

const userRegex = /^\/@([^/]+)/

// A blog page links `/@{username}/rss.xml`. The api.paragraph.com feed holds the same posts under
// other guids, and `/api/blogs/rss/` answers 308 to the linked feed.
const feeds = definePlatformFeeds([
  { key: 'paragraph:blog', template: 'https://paragraph.com/@{username}/rss.xml' },
  {
    key: 'paragraph:blog',
    template: 'https://api.paragraph.com/blogs/rss/@{username}',
    isAlias: true,
  },
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
