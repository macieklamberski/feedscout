import { misskey } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasAnyMeta, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: posts.

export type MisskeyUrl = { kind: 'profile'; username: string }

const feeds = withHintLabels(misskey.feeds)

const metaMarkers: Array<[string, string]> = [
  ['application-name', 'Misskey'],
  ['application-name', 'Sharkey'], // Fork, same feed routes
]

export const isMisskeyHtml = (content: string): boolean => {
  return hasElementWithId(content, 'misskey_meta') || hasAnyMeta(content, metaMarkers)
}

export const parseMisskeyUrl = (url: string): MisskeyUrl | undefined => {
  const page = misskey.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  return { kind: 'profile', username: page.params.username }
}

export const misskeyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isMisskeyHtml })) {
      return false
    }

    return parseMisskeyUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMisskeyUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    return [
      pageFeeds.getFeedEntry('posts', { username: parsed.username }, 'atom'),
      pageFeeds.getFeedEntry('posts', { username: parsed.username }, 'rss'),
      pageFeeds.getFeedEntry('posts', { username: parsed.username }, 'json'),
    ]
  },
}
