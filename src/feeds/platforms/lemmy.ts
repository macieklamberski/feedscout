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

export type LemmyPage = LemmyUrl

const lemmyPoweredByRegex = /lemmy/i

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

const getQuerySuffix = (page: LemmyPage): string => {
  const params = new URLSearchParams()

  if (page.sort) {
    params.set('sort', page.sort)
  }

  if (page.limit) {
    params.set('limit', page.limit)
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

  if (name && isAnyOf(section, 'c')) {
    return { kind: 'community', community: name, sort, limit }
  }

  if (name && isAnyOf(section, 'u')) {
    return { kind: 'user', username: name, sort, limit }
  }

  return { kind: 'home', sort, limit }
}

export const getLemmyPage = (url: string, content: string | undefined): LemmyPage | undefined => {
  const parsed = parseLemmyUrl(url)

  if (!parsed) {
    return
  }

  // The page advertises its feeds with the instance's default sort, which a feed URL without a sort
  // does not follow.
  const link = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'alternate'
  })
  const feedUrl = parseUrl(link?.attribs.href ?? '', 'https://example.com')
  const sorts = [parsed.sort, feedUrl?.searchParams.get('sort')]
  const sort = sorts.find((value) => value && validSorts.includes(value)) ?? undefined

  return { ...parsed, sort }
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
    const page = getLemmyPage(url, content)

    if (!page) {
      return []
    }

    const { origin } = new URL(url)
    const sortSuffix = getQuerySuffix(page)

    if (page.kind === 'community') {
      return [
        {
          uri: `${origin}/feeds/c/${page.community}.xml${sortSuffix}`,
          hint: composeHint('lemmy:community'),
        },
      ]
    }

    if (page.kind === 'user') {
      return [
        {
          uri: `${origin}/feeds/u/${page.username}.xml${sortSuffix}`,
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
