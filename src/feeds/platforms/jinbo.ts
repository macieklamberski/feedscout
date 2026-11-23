import { jinbo } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: category, posts, responses, tag.
// Handler needed for: comments, lines, trackbacks.

export type JinboUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'post'; username: string; postId: string }

const feeds = withHintLabels(jinbo.feeds)

export const parseJinboUrl = (url: string): JinboUrl | undefined => {
  const page = jinbo.pages.read(url)

  if (!page) {
    return
  }

  const { username, categoryId, tag, postId } = page.params

  if (page.key === 'category') {
    return { kind: 'category', username, categoryId }
  }

  if (page.key === 'tag') {
    return { kind: 'tag', username, tag }
  }

  // A post page links the comments and trackbacks of that post.
  if (page.key === 'post') {
    return { kind: 'post', username, postId }
  }

  return { kind: 'blog', username }
}

// The site answers a blog under any case of its name, and its pages link the feed in the
// blog's own case.
const getLinkedUsername = (href: string | undefined): string | undefined => {
  const feed = jinbo.feeds.read(href ?? '')

  if (feed?.key !== 'posts') {
    return
  }

  return feed.params.username
}

const getFeedUsername = (content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'alternate' &&
      getLinkedUsername(element.attribs.href) !== undefined
    )
  })

  return getLinkedUsername(link?.attribs.href)
}

const getJinboPage = (url: string, content: string | undefined): JinboUrl | undefined => {
  const parsed = parseJinboUrl(url)

  if (!parsed) {
    return
  }

  const username = getFeedUsername(content) ?? parsed.username

  return { ...parsed, username }
}

export const jinboHandler: PlatformHandler = {
  match: (url) => {
    return parseJinboUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getJinboPage(url, content)

    if (!page) {
      return []
    }

    const { username } = page

    if (page.kind === 'category') {
      return [
        feeds.getFeedEntry('category', { username, categoryId: page.categoryId }, 'rss'),
        feeds.getFeedEntry('category', { username, categoryId: page.categoryId }, 'atom'),
        feeds.getFeedEntry('posts', { username }, 'rss'),
        feeds.getFeedEntry('posts', { username }, 'atom'),
        feeds.getFeedEntry('responses', { username }, 'rss'),
        feeds.getFeedEntry('responses', { username }, 'atom'),
        feeds.getFeedEntry('comments', { username }, 'rss'),
        feeds.getFeedEntry('comments', { username }, 'atom'),
        feeds.getFeedEntry('trackbacks', { username }, 'rss'),
        feeds.getFeedEntry('trackbacks', { username }, 'atom'),
        feeds.getFeedEntry('lines', { username }, 'rss'),
        feeds.getFeedEntry('lines', { username }, 'atom'),
      ]
    }

    if (page.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { username, tag: page.tag }, 'atom'),
        feeds.getFeedEntry('posts', { username }, 'rss'),
        feeds.getFeedEntry('posts', { username }, 'atom'),
        feeds.getFeedEntry('responses', { username }, 'rss'),
        feeds.getFeedEntry('responses', { username }, 'atom'),
        feeds.getFeedEntry('comments', { username }, 'rss'),
        feeds.getFeedEntry('comments', { username }, 'atom'),
        feeds.getFeedEntry('trackbacks', { username }, 'rss'),
        feeds.getFeedEntry('trackbacks', { username }, 'atom'),
        feeds.getFeedEntry('lines', { username }, 'rss'),
        feeds.getFeedEntry('lines', { username }, 'atom'),
      ]
    }

    if (page.kind === 'post') {
      return [
        feeds.getFeedEntry('post-responses', { username, postId: page.postId }, 'rss'),
        feeds.getFeedEntry('post-responses', { username, postId: page.postId }, 'atom'),
        feeds.getFeedEntry('posts', { username }, 'rss'),
        feeds.getFeedEntry('posts', { username }, 'atom'),
        feeds.getFeedEntry('responses', { username }, 'rss'),
        feeds.getFeedEntry('responses', { username }, 'atom'),
        feeds.getFeedEntry('comments', { username }, 'rss'),
        feeds.getFeedEntry('comments', { username }, 'atom'),
        feeds.getFeedEntry('trackbacks', { username }, 'rss'),
        feeds.getFeedEntry('trackbacks', { username }, 'atom'),
        feeds.getFeedEntry('lines', { username }, 'rss'),
        feeds.getFeedEntry('lines', { username }, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('posts', { username }, 'rss'),
      feeds.getFeedEntry('posts', { username }, 'atom'),
      feeds.getFeedEntry('responses', { username }, 'rss'),
      feeds.getFeedEntry('responses', { username }, 'atom'),
      feeds.getFeedEntry('comments', { username }, 'rss'),
      feeds.getFeedEntry('comments', { username }, 'atom'),
      feeds.getFeedEntry('trackbacks', { username }, 'rss'),
      feeds.getFeedEntry('trackbacks', { username }, 'atom'),
      feeds.getFeedEntry('lines', { username }, 'rss'),
      feeds.getFeedEntry('lines', { username }, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
