import { composeQuery, getAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
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
  | { kind: 'top'; period?: string }
  | { kind: 'latest' }

const userRegex = /^\/u\/([^/]+)/i
// A category page takes a `/none` or `/all` subcategory tail and an `/l/{filter}` list tail, and the
// category feed answers only without them.
const categoryRegex = /^\/c\/(.+?)(?:\/(?:none|all))?(?:\/l\/.+)?\/?$/i
const topicRegex = /^\/t\/(?<slug>[^/]+)\/(?<topicId>[^/]+)/i
const topRegex = /^\/top(?:\/([^/]+))?\/?$/i

const validTopPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all']

const getTopPeriod = (
  pathPeriod: string | undefined,
  searchParams: URLSearchParams,
): string | undefined => {
  const period = getAnyOf(pathPeriod, validTopPeriods) ?? searchParams.get('period')

  if (period && validTopPeriods.includes(period)) {
    return period
  }
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

export const discourseHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isDiscourseHtml, headers: isDiscourseHeaders })) {
      return false
    }

    return parseDiscourseUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const basePath = getBasePath(content)
    const parsed = parseDiscourseUrl(stripBasePath(url, basePath))

    if (!parsed) {
      return []
    }

    const siteUrl = `${new URL(url).origin}${basePath}`

    if (parsed.kind === 'topic') {
      return [
        {
          uri: `${siteUrl}/t/${parsed.slug}/${parsed.topicId}.rss`,
          hint: composeHint('discourse:topic'),
        },
      ]
    }

    if (parsed.kind === 'user') {
      return [
        {
          uri: `${siteUrl}/u/${parsed.username}/activity.rss`,
          hint: composeHint('discourse:activity'),
        },
      ]
    }

    if (parsed.kind === 'category') {
      return [
        {
          uri: `${siteUrl}/c/${parsed.category}.rss`,
          hint: composeHint('discourse:category'),
        },
      ]
    }

    if (parsed.kind === 'top') {
      const periodQuery = parsed.period ? composeQuery({ period: parsed.period }) : ''

      return [
        {
          uri: `${siteUrl}/top.rss${periodQuery}`,
          hint: composeHint('discourse:top'),
        },
      ]
    }

    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `${siteUrl}/latest.rss`,
      hint: composeHint('discourse:latest'),
    })
    uris.push({
      uri: `${siteUrl}/posts.rss`,
      hint: composeHint('discourse:posts'),
    })

    return uris
  },
}
