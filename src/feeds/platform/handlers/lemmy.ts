import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

const lemmyPoweredByPattern = /lemmy/i

export const isCommunityPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'c'
}

export const isUserPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'u'
}

export const isLemmyHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Lemmy')
}

export const isLemmyHeaders = (headers: Headers): boolean => {
  const poweredBy = headers.get('x-powered-by') ?? ''

  return lemmyPoweredByPattern.test(poweredBy)
}

export const lemmyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      const { pathname } = new URL(url)

      if (!isCommunityPath(pathname) && !isUserPath(pathname)) {
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
      const { origin, pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)

      if (isCommunityPath(pathname) && segments[1]) {
        return [
          {
            uri: `${origin}/feeds/c/${segments[1]}.xml`,
            hint: composeHint('lemmy:community'),
          },
        ]
      }

      if (isUserPath(pathname) && segments[1]) {
        return [
          {
            uri: `${origin}/feeds/u/${segments[1]}.xml`,
            hint: composeHint('lemmy:user'),
          },
        ]
      }
    } catch {}

    return []
  },
}
