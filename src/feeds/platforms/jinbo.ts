import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JinboUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }
  | { kind: 'tag'; username: string; tag: string }

const hosts = ['blog.jinbo.net']
const baseUrl = 'https://blog.jinbo.net'

// A category named by text answers an empty feed under another category's title.
const categoryIdRegex = /^\d+$/
const feedLinkRegex = /^https:\/\/blog\.jinbo\.net\/([^/]+)\/rss$/
// A tag or category the blog lacks still answers an empty feed, and its page says it found none,
// in the wording of the blog's skin.
const noPostsRegex = />0<\/\w+>개의 게시물을 찾았습니다|에 (?:관한|해당되는) 글 0(?:개|건)/

// Site-wide pages and asset roots that share the first segment with blog names.
const excludedPaths = [
  'archive',
  'atom',
  'attach',
  'global',
  'jinboblog',
  'jplugins',
  'lines',
  'manual',
  'outpost',
  'plugins',
  'post',
  'register',
  'resources',
  'rss',
  'search',
  'sitemap',
  'skin',
]

export const parseJinboUrl = (url: string): JinboUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, section, value] = getPathSegments(url)

  // A segment like favicon.ico is a file at the root, not a blog.
  if (!username || username.includes('.') || isAnyOf(username, excludedPaths)) {
    return
  }

  if (isAnyOf(section, 'category') && value && categoryIdRegex.test(value)) {
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

  if (parsed.kind !== 'blog' && content && noPostsRegex.test(content)) {
    return { kind: 'blog', username }
  }

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

    const blogUrl = `${baseUrl}/${page.username}`
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'category') {
      uris.push({
        uri: `${blogUrl}/atom/category/${page.categoryId}`,
        hint: composeHint('jinbo:category', 'atom'),
      })
    }

    // The tag feed exists only as Atom: the RSS spelling answers 404.
    if (page.kind === 'tag') {
      uris.push({ uri: `${blogUrl}/atom/tag/${page.tag}`, hint: composeHint('jinbo:tag', 'atom') })
    }

    uris.push({ uri: `${blogUrl}/rss`, hint: composeHint('jinbo:posts', 'rss') })
    uris.push({ uri: `${blogUrl}/atom`, hint: composeHint('jinbo:posts', 'atom') })
    uris.push({ uri: `${blogUrl}/rss/response`, hint: composeHint('jinbo:responses', 'rss') })
    uris.push({ uri: `${blogUrl}/atom/response`, hint: composeHint('jinbo:responses', 'atom') })

    return uris
  },
}
