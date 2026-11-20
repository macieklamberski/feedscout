import { jinbo } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, findElement } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: category, posts, responses, tag.
// Handler needed for: comments, lines, trackbacks.

export type JinboUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'post'; username: string; postId: string }

const hosts = jinbo.hosts.exact

// A category named by text answers an empty feed under another category's title.
const feedLinkRegex = /^https:\/\/blog\.jinbo\.net\/([^/]+)\/rss$/i

const feeds = withHintLabels(jinbo.feeds)

export const parseJinboUrl = (url: string): JinboUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, value] = getPathSegments(url)

  // A segment like favicon.ico is a file at the root, not a blog.
  if (!username || username.includes('.')) {
    return
  }

  if (isAnyOf(section, 'category') && value && digitsRegex.test(value)) {
    return { kind: 'category', username, categoryId: value }
  }

  if (isAnyOf(section, 'tag') && value) {
    return { kind: 'tag', username, tag: value }
  }

  // A post page, /{username}/{postId}, links the comments and trackbacks of that post.
  if (section && digitsRegex.test(section)) {
    return { kind: 'post', username, postId: section }
  }

  return { kind: 'blog', username }
}

// The site answers a blog under any case of its name, and its pages link the feed in the
// blog's own case.
const getFeedUsername = (content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'alternate' &&
      feedLinkRegex.test(element.attribs.href ?? '')
    )
  })

  return link?.attribs.href?.match(feedLinkRegex)?.[1]
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
