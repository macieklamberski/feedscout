import { dasauge } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: jobs, workspaces.

export type DasaugeUrl = { kind: 'home' }

const feeds = withHintLabels(dasauge.feeds)

export const parseDasaugeUrl = (url: string): DasaugeUrl | undefined => {
  if (dasauge.pages.readUrl(url)?.key !== 'home') {
    return
  }

  return { kind: 'home' }
}

export const dasaugeHandler: PlatformHandler = {
  match: (url) => {
    return parseDasaugeUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forSite(url)

    if (!parseDasaugeUrl(url) || !page) {
      return []
    }

    return [page.getFeedEntry('jobs', {}, 'atom'), page.getFeedEntry('workspaces', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
