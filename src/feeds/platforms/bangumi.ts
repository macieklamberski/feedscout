import { bangumi } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: blog, collections.
// Handler needed for: timeline.

export type BangumiUrl = { kind: 'user'; username: string } | { kind: 'home' }

// chii.in serves the same site, but answers a plain fetch of its feeds with a Cloudflare challenge,
// so its pages get the bgm.tv feeds.
const challengedHosts = ['chii.in']

const feeds = withHintLabels(bangumi.feeds)

export const parseBangumiUrl = (url: string): BangumiUrl | undefined => {
  const page = bangumi.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'user') {
    return { kind: 'user', username: page.params.username }
  }

  return { kind: 'home' }
}

export const bangumiHandler: PlatformHandler = {
  match: (url) => {
    return parseBangumiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBangumiUrl(url)
    const pageFeeds = feeds.forUrl(isHostOf(url, challengedHosts) ? 'https://bgm.tv/' : url)

    if (!parsed || !pageFeeds) {
      return []
    }

    if (parsed.kind === 'user') {
      return [
        pageFeeds.getFeedEntry('collections', { username: parsed.username }),
        pageFeeds.getFeedEntry('timeline', { username: parsed.username }),
      ]
    }

    return [pageFeeds.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
