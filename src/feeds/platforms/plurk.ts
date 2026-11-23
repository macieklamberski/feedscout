import { plurk } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: plurks, responses.

export type PlurkUrl = { kind: 'post'; postId: string } | { kind: 'user'; username: string }

const feeds = withHintLabels(plurk.feeds)

export const parsePlurkUrl = (url: string): PlurkUrl | undefined => {
  const page = plurk.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'post') {
    return { kind: 'post', postId: page.params.postId }
  }

  return { kind: 'user', username: page.params.username }
}

export const plurkHandler: PlatformHandler = {
  match: (url) => {
    return parsePlurkUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePlurkUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'post') {
      return [feeds.getFeedEntry('responses', { postId: parsed.postId })]
    }

    return [feeds.getFeedEntry('plurks', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
