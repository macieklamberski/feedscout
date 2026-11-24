import { parsiblog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ParsiblogUrl = { kind: 'blog'; blog: string }

const feeds = withHintLabels(parsiblog.feeds)

export const parseParsiblogUrl = (url: string): ParsiblogUrl | undefined => {
  const page = parsiblog.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'blog', blog: page.params.blog }
}

export const parsiblogHandler: PlatformHandler = {
  match: (url) => {
    return parseParsiblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseParsiblogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // Every page, on either domain, links its feeds on {blog}.ParsiBlog.com. Parsiblog serves no
    // HTTPS, so an https page still gets http feeds.
    const params = { scheme: 'http', host: `${parsed.blog}.parsiblog.com` }

    return [page.getFeedEntry('posts', params, 'rss'), page.getFeedEntry('posts', params, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
