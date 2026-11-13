import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JinboUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'post'; username: string; postId: string }

const hosts = ['blog.jinbo.net']

// A category named by text answers an empty feed under another category's title.
const feedLinkRegex = /^https:\/\/blog\.jinbo\.net\/([^/]+)\/rss$/i

const feeds = definePlatformFeeds([
  {
    key: 'jinbo:category',
    template: 'https://blog.jinbo.net/{username}/atom/category/{categoryId}',
    format: 'atom',
  },
  // The tag feed exists only as Atom: the RSS spelling answers 404.
  {
    key: 'jinbo:tag',
    template: 'https://blog.jinbo.net/{username}/atom/tag/{tag}',
    format: 'atom',
  },
  { key: 'jinbo:posts', template: 'https://blog.jinbo.net/{username}/rss', format: 'rss' },
  { key: 'jinbo:posts', template: 'https://blog.jinbo.net/{username}/atom', format: 'atom' },
  {
    key: 'jinbo:responses',
    template: 'https://blog.jinbo.net/{username}/rss/response',
    format: 'rss',
  },
  {
    key: 'jinbo:responses',
    template: 'https://blog.jinbo.net/{username}/atom/response',
    format: 'atom',
  },
  {
    key: 'jinbo:post-responses',
    template: 'https://blog.jinbo.net/{username}/rss/response/{postId}',
    format: 'rss',
  },
  {
    key: 'jinbo:post-responses',
    template: 'https://blog.jinbo.net/{username}/atom/response/{postId}',
    format: 'atom',
  },
  {
    key: 'jinbo:comments',
    template: 'https://blog.jinbo.net/{username}/rss/comment',
    format: 'rss',
  },
  {
    key: 'jinbo:comments',
    template: 'https://blog.jinbo.net/{username}/atom/comment',
    format: 'atom',
  },
  {
    key: 'jinbo:trackbacks',
    template: 'https://blog.jinbo.net/{username}/rss/trackback',
    format: 'rss',
  },
  {
    key: 'jinbo:trackbacks',
    template: 'https://blog.jinbo.net/{username}/atom/trackback',
    format: 'atom',
  },
  { key: 'jinbo:lines', template: 'https://blog.jinbo.net/{username}/rss/line', format: 'rss' },
  { key: 'jinbo:lines', template: 'https://blog.jinbo.net/{username}/atom/line', format: 'atom' },
])

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
        feeds.getFeedEntry('jinbo:category', { username, categoryId: page.categoryId }, 'atom'),
        feeds.getFeedEntry('jinbo:posts', { username }, 'rss'),
        feeds.getFeedEntry('jinbo:posts', { username }, 'atom'),
        feeds.getFeedEntry('jinbo:responses', { username }, 'rss'),
        feeds.getFeedEntry('jinbo:responses', { username }, 'atom'),
      ]
    }

    if (page.kind === 'tag') {
      return [
        feeds.getFeedEntry('jinbo:tag', { username, tag: page.tag }, 'atom'),
        feeds.getFeedEntry('jinbo:posts', { username }, 'rss'),
        feeds.getFeedEntry('jinbo:posts', { username }, 'atom'),
        feeds.getFeedEntry('jinbo:responses', { username }, 'rss'),
        feeds.getFeedEntry('jinbo:responses', { username }, 'atom'),
      ]
    }

    if (page.kind === 'post') {
      return [
        feeds.getFeedEntry('jinbo:post-responses', { username, postId: page.postId }, 'rss'),
        feeds.getFeedEntry('jinbo:post-responses', { username, postId: page.postId }, 'atom'),
        feeds.getFeedEntry('jinbo:posts', { username }, 'rss'),
        feeds.getFeedEntry('jinbo:posts', { username }, 'atom'),
        feeds.getFeedEntry('jinbo:responses', { username }, 'rss'),
        feeds.getFeedEntry('jinbo:responses', { username }, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('jinbo:posts', { username }, 'rss'),
      feeds.getFeedEntry('jinbo:posts', { username }, 'atom'),
      feeds.getFeedEntry('jinbo:responses', { username }, 'rss'),
      feeds.getFeedEntry('jinbo:responses', { username }, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
