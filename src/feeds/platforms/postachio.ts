import { postachio } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PostachioUrl = { kind: 'site'; subdomain: string }

const feeds = withHintLabels(postachio.feeds)

export const parsePostachioUrl = (url: string): PostachioUrl | undefined => {
  const page = postachio.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'site', subdomain: page.values.subdomain }
}

export const postachioHandler: PlatformHandler = {
  match: (url) => {
    return parsePostachioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePostachioUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
