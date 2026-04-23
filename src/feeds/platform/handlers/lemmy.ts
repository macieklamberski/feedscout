import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

const lemmyPoweredByRegex = /lemmy/i
const validSorts = new Set([
  'Active',
  'Hot',
  'New',
  'Old',
  'TopDay',
  'TopWeek',
  'TopMonth',
  'TopYear',
  'TopAll',
  'MostComments',
  'NewComments',
])

const getSortSuffix = (searchParams: URLSearchParams): string => {
  const sort = searchParams.get('sort')

  if (sort && validSorts.has(sort)) {
    return `?sort=${sort}`
  }

  return ''
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
      const sortSuffix = getSortSuffix(searchParams)

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
