import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const trailingSlashRegex = /\/$/
const postOrHistoryRegex = /\/[ph]\/[^/]+$/i

// `snac/` with the slash, since the value is compared as a prefix and `snac` matches `snacks`.
export const isSnacHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'snac/')
}

export const isSnacHeaders = (headers: Headers): boolean => {
  return (headers.get('x-creator') ?? '').startsWith('snac/')
}

// An instance is routinely mounted under a sub-path, so the feed is built from the page path.
const getUserPath = (url: string): string | undefined => {
  const { pathname } = new URL(url)
  // A post lives at `/{user}/p/{id}` and a month of history at `/{user}/h/{month}.html`.
  const trimmed = pathname.replace(trailingSlashRegex, '').replace(postOrHistoryRegex, '')

  return trimmed.split('/').filter(Boolean).length > 0 ? trimmed : undefined
}

export const snacHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      const isSnac = (content && isSnacHtml(content)) || (headers && isSnacHeaders(headers))

      if (!isSnac) {
        return false
      }

      return Boolean(getUserPath(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const userPath = getUserPath(url)

    if (!userPath) {
      return []
    }

    return [{ uri: `${origin}${userPath}.rss`, hint: composeHint('snac:posts') }]
  },
}
