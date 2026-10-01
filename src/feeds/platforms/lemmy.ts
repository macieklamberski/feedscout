import { getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findElement,
  hasClass,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers community, user (html), partly covers home.

type LemmyQuery = { sort?: string; limit?: string }

export type LemmyUrl =
  | ({ kind: 'community'; community: string } & LemmyQuery)
  | ({ kind: 'user'; username: string } & LemmyQuery)
  | ({ kind: 'home' } & LemmyQuery)

const lemmyPoweredByRegex = /lemmy/i
const numericRegex = /^\d+$/

const validSorts = [
  'Active',
  'Hot',
  'New',
  'Old',
  'TopHour',
  'TopSixHour',
  'TopTwelveHour',
  'TopDay',
  'TopWeek',
  'TopMonth',
  'TopThreeMonths',
  'TopSixMonths',
  'TopNineMonths',
  'TopYear',
  'TopAll',
  'Controversial',
  'Scaled',
  'MostComments',
  'NewComments',
]

const getQuerySuffix = (query: LemmyQuery, content: string | undefined): string => {
  const params = new URLSearchParams()
  // The page advertises its feeds with the instance's default sort, which a feed URL without a sort
  // does not follow.
  const link = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })
  const feedUrl = parseUrl(link?.attribs.href ?? '', 'https://example.com')
  const sorts = [query.sort, feedUrl?.searchParams.get('sort')]
  const sort = sorts.find((value) => value && validSorts.includes(value))

  if (sort) {
    params.set('sort', sort)
  }

  if (query.limit && numericRegex.test(query.limit)) {
    params.set('limit', query.limit)
  }

  const suffix = params.toString()

  return suffix ? `?${suffix}` : ''
}

export const parseLemmyUrl = (url: string): LemmyUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [section, name] = getPathSegments(parsedUrl)
  const { searchParams } = parsedUrl
  const sort = searchParams.get('sort') ?? undefined
  const limit = searchParams.get('limit') ?? undefined

  if (!section) {
    return { kind: 'home', sort, limit }
  }

  if (!name) {
    return
  }

  if (isAnyOf(section, 'c')) {
    return { kind: 'community', community: name, sort, limit }
  }

  if (isAnyOf(section, 'u')) {
    return { kind: 'user', username: name, sort, limit }
  }
}

// Current Lemmy serves no generator meta.
export const isLemmyHtml = (content: string): boolean => {
  return (
    findElement(content, (element) => hasClass(element, 'lemmy-site')) !== undefined ||
    hasMetaContent(content, 'generator', 'Lemmy')
  )
}

export const isLemmyHeaders = (headers: Headers): boolean => {
  const poweredBy = headers.get('x-powered-by') ?? ''

  return lemmyPoweredByRegex.test(poweredBy)
}

export const lemmyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!parseLemmyUrl(url)) {
      return false
    }

    return hasMarker(content, headers, { html: isLemmyHtml, headers: isLemmyHeaders })
  },

  resolve: (url, content) => {
    const parsed = parseLemmyUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const sortSuffix = getQuerySuffix(parsed, content)

    if (parsed.kind === 'community') {
      return [
        {
          uri: `${origin}/feeds/c/${parsed.community}.xml${sortSuffix}`,
          hint: composeHint('lemmy:community'),
        },
      ]
    }

    if (parsed.kind === 'user') {
      return [
        {
          uri: `${origin}/feeds/u/${parsed.username}.xml${sortSuffix}`,
          hint: composeHint('lemmy:user'),
        },
      ]
    }

    return [
      {
        uri: `${origin}/feeds/all.xml${sortSuffix}`,
        hint: composeHint('lemmy:all'),
      },
      {
        uri: `${origin}/feeds/local.xml${sortSuffix}`,
        hint: composeHint('lemmy:local'),
      },
    ]
  },
}
