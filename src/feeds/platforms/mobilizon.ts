import { mobilizon } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: group.
// Handler needed for: instance.

export type MobilizonUrl = { kind: 'group'; group: string } | { kind: 'instance' }

const feeds = withHintLabels(mobilizon.feeds)

// The page is a JavaScript shell, and this notice is the only text the server renders on every page.
export const isMobilizonHtml = (content: string): boolean => {
  return content.includes("Mobilizon doesn't work properly without JavaScript")
}

export const parseMobilizonUrl = (url: string): MobilizonUrl | undefined => {
  const page = mobilizon.pages.read(url, { root: parseUrl(url)?.origin ?? '' })

  if (!page) {
    return
  }

  if (page.key === 'group') {
    return { kind: 'group', group: page.params.group }
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
        pageFeeds.getFeedEntry('group', { group: parsed.group }),
        pageFeeds.getFeedEntry('instance'),
      ]
    }

    return [pageFeeds.getFeedEntry('instance')]
  },
}
