import { duckWebcomics } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type DuckWebcomicsUrl = { kind: 'comic'; comic: string }

const feeds = withHintLabels(duckWebcomics.feeds)

export const parseDuckWebcomicsUrl = (url: string): DuckWebcomicsUrl | undefined => {
  const page = duckWebcomics.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'comic', comic: page.values.comic }
}

export const duckWebcomicsHandler: PlatformHandler = {
  match: (url) => {
    return parseDuckWebcomicsUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = parseDuckWebcomicsUrl(url)
    const pageFeeds = feeds.forSite(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('comic', { comic: page.comic })]
  },

  getFeedHint: feeds.getFeedHint,
}
