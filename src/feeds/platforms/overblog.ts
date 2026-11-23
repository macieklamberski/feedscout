import { overblog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type OverblogUrl = { kind: 'blog' }

const feeds = withHintLabels(overblog.feeds)

export const parseOverblogUrl = (url: string): OverblogUrl | undefined => {
  if (!overblog.pages.read(url)) {
    return
  }

  return { kind: 'blog' }
}

export const overblogHandler: PlatformHandler = {
  match: (url) => {
    return parseOverblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOverblogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
