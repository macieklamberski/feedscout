import { seesaa } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler adds formats for: posts (rss).

export type SeesaaUrl = { kind: 'blog' }

const feeds = withHintLabels(seesaa.feeds)

export const parseSeesaaUrl = (url: string): SeesaaUrl | undefined => {
  const page = seesaa.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'blog' }
}

export const seesaaHandler: PlatformHandler = {
  match: (url) => {
    return parseSeesaaUrl(url) !== undefined
  },

  resolve: (url) => {
    const blog = seesaa.pages.read(url)
    const page = feeds.forUrl(url)

    if (!blog || !page) {
      return []
    }

    // The certificate the blogs share leaves out stablo.jp, so its blogs serve feeds over http.
    // The other domains redirect http to https.
    const params = { scheme: blog.params.domain === 'stablo.jp' ? 'http' : 'https' }

    return [
      page.getFeedEntry('posts', params, 'rss'),
      page.getFeedEntry('posts', params, 'rdf'),
      page.getFeedEntry('podcast', params, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
