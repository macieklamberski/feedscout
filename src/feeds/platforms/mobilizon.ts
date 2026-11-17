import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: group.
// Handler needed for: instance.

export type MobilizonUrl = { kind: 'group'; group: string } | { kind: 'instance' }

const groupPathRegex = /^\/@([^/]+)/

// Mobilizon is self-hosted and known only by its page marker, so nothing in a feed URL names it
// and the table only builds.
const feeds = definePlatformFeeds([
  { key: 'mobilizon:group', main: '{root}/@{group}/feed/atom' },
  { key: 'mobilizon:instance', main: '{root}/feed/instance/atom' },
])

// The page is a JavaScript shell, and this notice is the only text the server renders on every page.
export const isMobilizonHtml = (content: string): boolean => {
  return content.includes("Mobilizon doesn't work properly without JavaScript")
}

export const parseMobilizonUrl = (url: string): MobilizonUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const group = parsedUrl.pathname.match(groupPathRegex)?.[1]

  if (group) {
    return { kind: 'group', group }
  }

  return { kind: 'instance' }
}

export const mobilizonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isMobilizonHtml })) {
      return false
    }

    return parseMobilizonUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMobilizonUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'group') {
      return [
        pageFeeds.getFeedEntry('mobilizon:group', { group: parsed.group }),
        pageFeeds.getFeedEntry('mobilizon:instance'),
      ]
    }

    return [pageFeeds.getFeedEntry('mobilizon:instance')]
  },
}
