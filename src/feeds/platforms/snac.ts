import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SnacUrl = { kind: 'user'; path: string }

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
export const parseSnacUrl = (url: string): SnacUrl | undefined => {
  const pathname = parseUrl(url)?.pathname ?? ''
  // A post lives at `/{user}/p/{id}` and a month of history at `/{user}/h/{month}.html`.
  const path = pathname.replace(trailingSlashRegex, '').replace(postOrHistoryRegex, '')

  if (path.split('/').filter(Boolean).length === 0) {
    return
  }

  return { kind: 'user', path }
}

export const snacHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isSnacHtml, headers: isSnacHeaders })) {
      return false
    }

    return parseSnacUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSnacUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}${parsed.path}.rss`, hint: composeHint('snac:posts') }]
  },
}
