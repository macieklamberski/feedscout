import { getAnyOf, getQueryParam, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  digitsRegex,
  findElement,
  formatSuffixRegex,
  hasElementWithId,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers category, home, top, topic (html).
// Handler needed for: user.

export type DiscourseUrl =
  | { kind: 'topic'; slug: string; topicId: string }
  | { kind: 'user'; username: string }
  | { kind: 'category'; category: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'top'; period?: string }
  | { kind: 'latest' }
export type DiscoursePage = DiscourseUrl & { siteUrl: string }

const userRegex = /^\/u\/([^/]+)/i
// A category page takes a `/none` or `/all` subcategory tail and an `/l/{filter}` list tail, and
// the category feed answers only without them.
const categoryRegex = /^\/c\/(.+?)(?:\/(?:none|all))?(?:\/l\/.+)?\/?$/i
// A tag page is `/tag/{slug}` or `/tag/{slug}/{id}`, with an optional `/l/{filter}` list tail.
const tagRegex = /^\/tag\/([^/]+(?:\/[^/]+)?)(?:\/l\/.+)?\/?$/i
const topicRegex = /^\/t\/(?<slug>[^/]+)\/(?<topicId>[^/]+)/i
const topRegex = /^\/top(?:\/([^/]+))?\/?$/i

const validTopPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all']

const domains = ['discourse.group', 'trydiscourse.com']

// The feeds of a forum from its root, which a platform subdomain serves from and an install on its
// own domain can put under a sub-path its markup names.
const feeds = definePlatformFeeds(
  [
    { key: 'discourse:topic', template: '{root}/t/{slug}/{topicId}.rss' },
    { key: 'discourse:activity', template: '{root}/u/{username}/activity.rss' },
    { key: 'discourse:category', template: '{root}/c/{category*}.rss' },
    { key: 'discourse:tag', template: '{root}/tag/{slug}/{id}.rss' },
    { key: 'discourse:tag', template: '{root}/tag/{slug}.rss', isAlias: true },
    { key: 'discourse:top', template: '{root}/top.rss?period={period}' },
    { key: 'discourse:top', template: '{root}/top.rss' },
    { key: 'discourse:latest', template: '{root}/latest.rss' },
    { key: 'discourse:posts', template: '{root}/posts.rss' },
  ],
  { domains },
)

const getTopPeriod = (
  pathPeriod: string | undefined,
  searchParams: URLSearchParams,
): string | undefined => {
  const period = getAnyOf(pathPeriod, validTopPeriods) ?? getQueryParam(searchParams, 'period')

  return getAnyOf(period, validTopPeriods)
}

// A path the parser does not name falls back to the latest topics, on the root and elsewhere.
export const parseDiscourseUrl = (url: string): DiscourseUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const topicMatch = pathname.match(topicRegex)?.groups
  // A topic also answers with a format extension, as `.json` and `.rss`.
  const topicId = topicMatch?.topicId?.replace(formatSuffixRegex, '')

  if (topicMatch?.slug && topicId && digitsRegex.test(topicId)) {
    return { kind: 'topic', slug: topicMatch.slug, topicId }
  }

  const username = pathname.match(userRegex)?.[1]

  if (username) {
    return { kind: 'user', username }
  }

  const category = pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', category }
  }

  // A tag also answers with a format extension, as `.rss`.
  const tag = pathname.match(tagRegex)?.[1]?.replace(formatSuffixRegex, '')

  if (tag) {
    return { kind: 'tag', tag }
  }

  // Top topics: /top or /top/{period}
  const topMatch = pathname.match(topRegex)

  if (topMatch) {
    return { kind: 'top', period: getTopPeriod(topMatch[1], searchParams) }
  }

  return { kind: 'latest' }
}

export const isDiscourseHtml = (content: string): boolean => {
  return (
    hasMetaContent(content, 'generator', 'Discourse') ||
    hasElementWithId(content, 'data-discourse-setup')
  )
}

export const isDiscourseHeaders = (headers: Headers): boolean => {
  return headers.has('x-discourse-route')
}

// An install under a sub-path such as `/forum` names it in the setup meta's `data-base-uri`.
const getBasePath = (content: string | undefined): string => {
  const setup = findElement(content, (element) => element.attribs.id === 'data-discourse-setup')

  return setup?.attribs['data-base-uri'] ?? ''
}

// The parser reads paths from the install's root, so the sub-path is cut from the front.
const stripBasePath = (url: string, basePath: string): string => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl?.pathname.startsWith(`${basePath}/`)) {
    return url
  }

  return `${parsedUrl.origin}${parsedUrl.pathname.slice(basePath.length)}${parsedUrl.search}`
}

export const getDiscoursePage = (
  url: string,
  content: string | undefined,
): DiscoursePage | undefined => {
  const basePath = getBasePath(content)
  const parsed = parseDiscourseUrl(stripBasePath(url, basePath))

  if (!parsed) {
    return
  }

  return { ...parsed, siteUrl: `${new URL(url).origin}${basePath}` }
}

export const discourseHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isDiscourseHtml, headers: isDiscourseHeaders })) {
      return false
    }

    return parseDiscourseUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getDiscoursePage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const root = page.siteUrl

    if (page.kind === 'topic') {
      return [
        pageFeeds.getFeedEntry('discourse:topic', {
          root,
          slug: page.slug,
          topicId: page.topicId,
        }),
      ]
    }

    if (page.kind === 'user') {
      return [pageFeeds.getFeedEntry('discourse:activity', { root, username: page.username })]
    }

    if (page.kind === 'category') {
      return [pageFeeds.getFeedEntry('discourse:category', { root, category: page.category })]
    }

    if (page.kind === 'tag') {
      const [slug, id] = page.tag.split('/')

      return [pageFeeds.getFeedEntry('discourse:tag', { root, slug, id })]
    }

    if (page.kind === 'top') {
      return [pageFeeds.getFeedEntry('discourse:top', { root, period: page.period })]
    }

    return [
      pageFeeds.getFeedEntry('discourse:latest', { root }),
      pageFeeds.getFeedEntry('discourse:posts', { root }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
