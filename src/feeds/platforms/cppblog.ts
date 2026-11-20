import { cppblog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: category, favorites, posts.
// Handler needed for: comments.

export type CppblogUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }
  | { kind: 'favorite'; username: string; favoriteId: string }

const feedLinkRegex = /^https?:\/\/(?:www\.)?cppblog\.com\/([^/]+)\/rss\.aspx$/i

const feeds = withHintLabels(cppblog.feeds)

export const parseCppblogUrl = (url: string): CppblogUrl | undefined => {
  const page = cppblog.pages.read(url)

  if (!page) {
    return
  }

  const { username, categoryId, favoriteId } = page.params

  if (page.key === 'category') {
    return { kind: 'category', username, categoryId }
  }

  if (page.key === 'favorite') {
    return { kind: 'favorite', username, favoriteId }
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

    if (page.kind === 'category') {
      return [
        feeds.getFeedEntry('category', { username, categoryId: page.categoryId }),
        feeds.getFeedEntry('posts', { username }),
        feeds.getFeedEntry('comments', { username }),
      ]
    }

    if (page.kind === 'favorite') {
      return [
        feeds.getFeedEntry('favorites', { username, favoriteId: page.favoriteId }),
        feeds.getFeedEntry('posts', { username }),
        feeds.getFeedEntry('comments', { username }),
      ]
    }

    return [feeds.getFeedEntry('posts', { username }), feeds.getFeedEntry('comments', { username })]
  },

  getFeedHint: feeds.getFeedHint,
}
