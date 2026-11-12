import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JinboUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }
  | { kind: 'tag'; username: string; tag: string }

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
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'category') {
      uris.push(
        feeds.getFeedEntry('jinbo:category', { username, categoryId: page.categoryId }, 'atom'),
      )
    }

    if (page.kind === 'tag') {
      uris.push(feeds.getFeedEntry('jinbo:tag', { username, tag: page.tag }, 'atom'))
    }

    uris.push(feeds.getFeedEntry('jinbo:posts', { username }, 'rss'))
    uris.push(feeds.getFeedEntry('jinbo:posts', { username }, 'atom'))
    uris.push(feeds.getFeedEntry('jinbo:responses', { username }, 'rss'))
    uris.push(feeds.getFeedEntry('jinbo:responses', { username }, 'atom'))

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
