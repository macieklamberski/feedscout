import { getPathSegments, isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasClass, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers community, user (html).
// Handler needed for: home.

export type LemmyUrl = { kind: 'community'; community: string } | { kind: 'user'; username: string }

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

// The page advertises its feeds with the instance's default sort, which a feed URL without a sort
// does not follow.
const getAdvertisedSort = (content: string | undefined): string | undefined => {
  if (!content) {
    return
  }

  const link = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })

  return (
    parseUrl(link?.attribs.href ?? '', 'https://example.com')?.searchParams.get('sort') ?? undefined
  )
}

const getQuerySuffix = (searchParams: URLSearchParams, content: string | undefined): string => {
  const params = new URLSearchParams()
  const sort = searchParams.get('sort') ?? getAdvertisedSort(content)

  if (sort && validSorts.includes(sort)) {
    params.set('sort', sort)
  }

  const limit = searchParams.get('limit')

  if (limit && numericRegex.test(limit)) {
    params.set('limit', limit)
  }

  const query = params.toString()

  return query ? `?${query}` : ''
}

export const parseLemmyUrl = (url: string): LemmyUrl | undefined => {
  const [section, name] = getPathSegments(url)

  if (!name) {
    return
  }

  if (isAnyOf(section, 'c')) {
    return { kind: 'community', community: name }
  }

  if (isAnyOf(section, 'u')) {
    return { kind: 'user', username: name }
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
    if (parseUrl(url)?.pathname !== '/' && !parseLemmyUrl(url)) {
      return false
    }

    if (content && isLemmyHtml(content)) {
      return true
    }

    if (headers && isLemmyHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url, content) => {
    const { origin, searchParams } = new URL(url)
    const parsed = parseLemmyUrl(url)
    const sortSuffix = getQuerySuffix(searchParams, content)

    if (parsed?.kind === 'community') {
      return [
        {
          uri: `${origin}/feeds/c/${parsed.community}.xml${sortSuffix}`,
          hint: composeHint('lemmy:community'),
        },
      ]
    }

    if (parsed?.kind === 'user') {
      return [
        {
          uri: `${origin}/feeds/u/${parsed.username}.xml${sortSuffix}`,
          hint: composeHint('lemmy:user'),
        },
      ]
    }

    // Home page and any other page: the instance feeds.
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
