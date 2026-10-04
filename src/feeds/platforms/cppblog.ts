import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers favorite (html), partly covers blog, category.

export type CppblogUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }
  | { kind: 'favorite'; username: string; favoriteId: string }

const hosts = ['cppblog.com', 'www.cppblog.com']
// The https certificate has expired, and every page links its feeds at this origin, the apex too.
const feedsOrigin = 'http://www.cppblog.com'

const listPageRegex = /^(\d+)\.html$/i
const feedLinkRegex = /^https?:\/\/(?:www\.)?cppblog\.com\/([^/]+)\/rss\.aspx$/i

// Site-wide directories the pages link, beside site files such as `login.aspx`.
const excludedPaths = ['admin', 'aggsite', 'css', 'images', 'script', 'skins']

export const parseCppblogUrl = (url: string): CppblogUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, page] = getPathSegments(url)

  if (!username || username.includes('.') || isAnyOf(username, excludedPaths)) {
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

    const blogUrl = `${feedsOrigin}/${page.username}`
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'category') {
      uris.push({
        uri: `${blogUrl}/category/${page.categoryId}.html/rss`,
        hint: composeHint('cppblog:category'),
      })
    }

    if (page.kind === 'favorite') {
      uris.push({
        uri: `${blogUrl}/favorite/${page.favoriteId}.html/rss`,
        hint: composeHint('cppblog:favorites'),
      })
    }

    uris.push({ uri: `${blogUrl}/rss.aspx`, hint: composeHint('cppblog:posts') })
    uris.push({ uri: `${blogUrl}/CommentsRSS.aspx`, hint: composeHint('cppblog:comments') })

    return uris
  },
}
