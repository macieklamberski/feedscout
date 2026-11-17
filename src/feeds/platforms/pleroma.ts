import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getScriptText, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler adds formats for: posts (rss).

export type PleromaUrl = { kind: 'profile'; username: string }

const apiPath = '/api/pleroma/'

const profileRegex = /^\/users\/([^/]+)/i
// The frontend serves the same profile at /{name} and /@{name}.
const profileAliasRegex = /^\/@?([^/]+)\/?$/

// An instance is known only by its markup, so its feeds are built on the page's origin and claimed
// on no host.
const feeds = definePlatformFeeds([
  { key: 'pleroma:posts', main: '{root}/users/{username}/feed.atom', format: 'atom' },
  { key: 'pleroma:posts', main: '{root}/users/{username}/feed.rss', format: 'rss' },
])

// The frontend preloads its config from the API, and older releases inline that response in the
// `initial-results` script, keyed by its path.
export const isPleromaHtml = (content: string): boolean => {
  const preload = findElement(content, (element) => {
    return element.name === 'link' && (element.attribs.href ?? '').startsWith(apiPath)
  })

  if (preload) {
    return true
  }

  return getScriptText(content, 'initial-results')?.includes(`"${apiPath}`) ?? false
}

export const parsePleromaUrl = (url: string): PleromaUrl | undefined => {
  const pathname = parseUrl(url)?.pathname
  const username = pathname?.match(profileRegex)?.[1] ?? pathname?.match(profileAliasRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const pleromaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPleromaHtml })) {
      return false
    }

    return parsePleromaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePleromaUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    const params = { username: parsed.username }

    return [
      pageFeeds.getFeedEntry('pleroma:posts', params, 'atom'),
      pageFeeds.getFeedEntry('pleroma:posts', params, 'rss'),
    ]
  },
}
