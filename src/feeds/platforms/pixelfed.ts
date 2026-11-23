import { pixelfed } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasAnyMeta, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PixelfedUrl = { kind: 'user'; username: string }

const metaMarkers: Array<[string, string]> = [
  ['generator', 'pixelfed'],
  ['application-name', 'Pixelfed'],
]

const feeds = withHintLabels(pixelfed.feeds)

export const isPixelfedHtml = (content: string): boolean => {
  return hasAnyMeta(content, metaMarkers)
}

export const parsePixelfedUrl = (url: string): PixelfedUrl | undefined => {
  const page = pixelfed.pages.read(url, { root: parseUrl(url)?.origin ?? '' })

  if (!page) {
    return
  }

  return { kind: 'user', username: page.params.username }
}

export const pixelfedHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPixelfedHtml })) {
      return false
    }

    return parsePixelfedUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePixelfedUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('posts', { username: parsed.username })]
  },
}
