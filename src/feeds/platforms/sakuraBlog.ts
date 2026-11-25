import { sakuraBlog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type SakuraBlogUrl = { kind: 'blog'; hostname: string }

const feeds = withHintLabels(sakuraBlog.feeds)

export const parseSakuraBlogUrl = (url: string): SakuraBlogUrl | undefined => {
  const page = sakuraBlog.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'blog', hostname: page.values.host }
}

export const sakuraBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseSakuraBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forSite(url)

    if (!parseSakuraBlogUrl(url) || !page) {
      return []
    }

    return [page.getFeedSpellings('posts', {}, 'rss'), page.getFeedEntry('posts', {}, 'rdf')]
  },

  getFeedHint: feeds.getFeedHint,
}
