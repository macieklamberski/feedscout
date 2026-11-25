import { travellerspoint } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type TravellerspointUrl = { kind: 'blog'; blog: string }

const feeds = withHintLabels(travellerspoint.feeds)

export const parseTravellerspointUrl = (url: string): TravellerspointUrl | undefined => {
  const page = travellerspoint.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'blog', blog: page.values.blog }
}

export const travellerspointHandler: PlatformHandler = {
  match: (url) => {
    return parseTravellerspointUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forSite(url)

    if (!parseTravellerspointUrl(url) || !page) {
      return []
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
