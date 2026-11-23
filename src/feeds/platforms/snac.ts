import { snac } from 'feedintel'
import { encodePathSegment } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SnacUrl = { kind: 'user'; path: string }

const feeds = withHintLabels(snac.feeds)

// `snac/` with the slash, since the value is compared as a prefix and `snac` matches `snacks`.
export const isSnacHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'snac/')
}

export const isSnacHeaders = (headers: Headers): boolean => {
  return (headers.get('x-creator') ?? '').startsWith('snac/')
}

// An instance is routinely mounted under a sub-path, so the feed is built from the page path.
export const parseSnacUrl = (url: string): SnacUrl | undefined => {
  const page = snac.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  const { root, user } = page.params

  return { kind: 'user', path: new URL(`${root}/${encodePathSegment(user)}`).pathname }
}

export const snacHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isSnacHtml, headers: isSnacHeaders })) {
      return false
    }

    return parseSnacUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = snac.pages.read(url, { isAnyHost: true })

    if (!page) {
      return []
    }

    const { root, user } = page.params

    return [feeds.getFeedEntry('posts', { root, user })]
  },
}
