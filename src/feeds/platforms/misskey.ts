import { misskey } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasAnyMeta, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: posts.

export type MisskeyUrl = { kind: 'profile'; username: string }

const profileRegex = /^\/@(?<segment>[^/]+)/
// suffixes: Misskey's own profile feed formats. A remote handle, @user@host.tld, holds dots, so
// only these suffixes are stripped.
const feedSuffixRegex = /\.(?:atom|rss|json)$/i

const feeds = withHintLabels(misskey.feeds)

const metaMarkers: Array<[string, string]> = [
  ['application-name', 'Misskey'],
  ['application-name', 'Sharkey'], // Fork, same feed routes
]

export const isMisskeyHtml = (content: string): boolean => {
  return hasElementWithId(content, 'misskey_meta') || hasAnyMeta(content, metaMarkers)
}

export const parseMisskeyUrl = (url: string): MisskeyUrl | undefined => {
  const segment = parseUrl(url)?.pathname.match(profileRegex)?.groups?.segment
  // A feed URL, such as /@alice.atom, names its profile too.
  const username = segment?.replace(feedSuffixRegex, '')

  if (!username) {
    return
  }

  return { kind: 'profile', username }
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
      pageFeeds.getFeedEntry('misskey:posts', { username: parsed.username }, 'atom'),
      pageFeeds.getFeedEntry('misskey:posts', { username: parsed.username }, 'rss'),
      pageFeeds.getFeedEntry('misskey:posts', { username: parsed.username }, 'json'),
    ]
  },
}
