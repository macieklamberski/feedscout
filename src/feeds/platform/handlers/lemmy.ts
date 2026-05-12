import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Lemmy instances serve RSS 2.0 at `/feeds/{all,local}.xml`,
// `/feeds/c/{community}.xml`, and `/feeds/u/{user}.xml`, with optional
// `?sort=` and `?limit=` pass-through. Detection is instance-agnostic: the
// handler reads `<meta name="generator" content="Lemmy">` from page HTML or
// the `x-powered-by: Lemmy` response header, since the federated host set
// is unbounded. The handler maps `/c/{name}`, `/u/{name}`, and home routes
// to their feed twins and forwards whitelisted query params.

const lemmyPoweredByRegex = /lemmy/i
const validSorts = new Set([
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
])

const numericRegex = /^\d+$/

const getQuerySuffix = (searchParams: URLSearchParams): string => {
  const params = new URLSearchParams()
  const sort = searchParams.get('sort')

  if (sort && validSorts.has(sort)) {
    params.set('sort', sort)
  }

  const limit = searchParams.get('limit')

  if (limit && numericRegex.test(limit)) {
    params.set('limit', limit)
  }

  const query = params.toString()

  return query ? `?${query}` : ''
}

export const isCommunityPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'c'
}

export const isUserPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'u'
}

export const isHomePath = (pathname: string): boolean => {
  return pathname === '/' || pathname === '' || pathname === '/home'
}

export const isLemmyHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Lemmy')
}

export const isLemmyHeaders = (headers: Headers): boolean => {
  const poweredBy = headers.get('x-powered-by') ?? ''

  return lemmyPoweredByRegex.test(poweredBy)
}

export const lemmyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      const { pathname } = new URL(url)

      if (!isCommunityPath(pathname) && !isUserPath(pathname) && !isHomePath(pathname)) {
        return false
      }

      if (content && isLemmyHtml(content)) {
        return true
      }

      if (headers && isLemmyHeaders(headers)) {
        return true
      }
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname, searchParams } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)
      const sortSuffix = getQuerySuffix(searchParams)

      if (isCommunityPath(pathname) && segments[1]) {
        return [
          {
            uri: `${origin}/feeds/c/${segments[1]}.xml${sortSuffix}`,
            hint: composeHint('lemmy:community'),
          },
        ]
      }

      if (isUserPath(pathname) && segments[1]) {
        return [
          {
            uri: `${origin}/feeds/u/${segments[1]}.xml${sortSuffix}`,
            hint: composeHint('lemmy:user'),
          },
        ]
      }

      if (isHomePath(pathname)) {
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
      }
    } catch {}

    return []
  },
}
