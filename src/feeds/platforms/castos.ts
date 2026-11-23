import { castos } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findUrls } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CastosUrl = { kind: 'show'; slug: string }
export type CastosPage = { kind: 'show'; slug: string; feedId?: string }

const feeds = withHintLabels(castos.feeds)

// The feed id is opaque, so it is read from the feed link every show page carries. The show
// site's /feed alias reads no id.
const getLinkedFeedId = (content: string): string | undefined => {
  for (const url of findUrls(content)) {
    const feedId = castos.feeds.read(url)?.params.feedId

    if (feedId) {
      return feedId
    }
  }
}

export const parseCastosUrl = (url: string): CastosUrl | undefined => {
  const page = castos.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'show', slug: page.params.slug }
}

export const getCastosPage = (url: string, content: string | undefined): CastosPage | undefined => {
  const parsed = parseCastosUrl(url)

  if (!parsed) {
    return
  }

  return { ...parsed, feedId: getLinkedFeedId(content ?? '') }
}

export const castosHandler: PlatformHandler = {
  match: (url) => {
    return parseCastosUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getCastosPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('podcast', { feedId: page.feedId })]
  },

  getFeedHint: feeds.getFeedHint,
}
