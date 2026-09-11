import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// snac serves a per-user RSS feed at the user page path plus `.rss`.
//
// An instance is routinely mounted under a sub-path rather than at the domain
// root, so the feed is built from the page path and never from the origin.
//
// The generator value is matched with its trailing slash, `snac/`, because
// `snac` alone is four characters and the meta content is compared as a prefix.

const trailingSlashRegex = /\/$/

export const isSnacHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'snac/')
}

const getUserPath = (url: string): string | undefined => {
  const { pathname } = new URL(url)
  const trimmed = pathname.replace(trailingSlashRegex, '')

  return trimmed.split('/').filter(Boolean).length > 0 ? trimmed : undefined
}

export const snacHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isSnacHtml(content)) {
        return false
      }

      return Boolean(getUserPath(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin } = new URL(url)
      const userPath = getUserPath(url)

      if (!userPath) {
        return []
      }

      return [{ uri: `${origin}${userPath}.rss`, hint: composeHint('snac:posts') }]
    } catch {}

    return []
  },
}
