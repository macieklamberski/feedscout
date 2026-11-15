import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasAnyMeta, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PixelfedUrl = { kind: 'user'; username: string }

const profileRegex = /^\/(?:users\/)?([^/]+)\/?$/i

const metaMarkers: Array<[string, string]> = [
  ['generator', 'pixelfed'],
  ['application-name', 'Pixelfed'],
]

// An instance is known only by its markup, so its feeds are built on the page's origin and claimed
// on no host.
const feeds = definePlatformFeeds([
  { key: 'pixelfed:posts', template: '{root}/users/{username}.atom' },
])

export const isPixelfedHtml = (content: string): boolean => {
  return hasAnyMeta(content, metaMarkers)
}

export const parsePixelfedUrl = (url: string): PixelfedUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const username = parsedUrl.pathname.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'user', username }
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

    return [pageFeeds.getFeedEntry('pixelfed:posts', { username: parsed.username })]
  },
}
