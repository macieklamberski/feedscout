import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers favorite (html), partly covers blog, category.

export type CppblogUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }
  | { kind: 'favorite'; username: string; favoriteId: string }

const hosts = ['cppblog.com', 'www.cppblog.com']

const listPageRegex = /^(\d+)\.html$/i
const feedLinkRegex = /^https?:\/\/(?:www\.)?cppblog\.com\/([^/]+)\/rss\.aspx$/i

// The https certificate has expired, and every page links its feeds at this origin, the apex too.
const feeds = definePlatformFeeds([
  {
    key: 'cppblog:category',
    template: 'http://www.cppblog.com/{username}/category/{categoryId}.html/rss',
  },
  {
    key: 'cppblog:favorites',
    template: 'http://www.cppblog.com/{username}/favorite/{favoriteId}.html/rss',
  },
  { key: 'cppblog:posts', template: 'http://www.cppblog.com/{username}/rss.aspx' },
  { key: 'cppblog:comments', template: 'http://www.cppblog.com/{username}/CommentsRSS.aspx' },
])

export const parseCppblogUrl = (url: string): CppblogUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, page] = getPathSegments(url)

  if (!username || username.includes('.')) {
    return
  }

  const listId = page?.match(listPageRegex)?.[1]

  if (listId && isAnyOf(section, 'category')) {
    return { kind: 'category', username, categoryId: listId }
  }

  if (listId && isAnyOf(section, 'favorite')) {
    return { kind: 'favorite', username, favoriteId: listId }
  }

  return { kind: 'blog', username }
}

// The site answers a blog in any case and under aliases, and its pages link the blog's own feed.
const getFeedUsername = (content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.id === 'RSSLink'
  })

  return link?.attribs.href?.match(feedLinkRegex)?.[1]
}

const getCppblogPage = (url: string, content: string | undefined): CppblogUrl | undefined => {
  const parsed = parseCppblogUrl(url)

  if (!parsed) {
    return
  }

  return { ...parsed, username: getFeedUsername(content) ?? parsed.username }
}

export const cppblogHandler: PlatformHandler = {
  match: (url) => {
    return parseCppblogUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getCppblogPage(url, content)

    if (!page) {
      return []
    }

    const { username } = page
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'category') {
      uris.push(feeds.getFeedEntry('cppblog:category', { username, categoryId: page.categoryId }))
    }

    if (page.kind === 'favorite') {
      uris.push(feeds.getFeedEntry('cppblog:favorites', { username, favoriteId: page.favoriteId }))
    }

    uris.push(feeds.getFeedEntry('cppblog:posts', { username }))
    uris.push(feeds.getFeedEntry('cppblog:comments', { username }))

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}
