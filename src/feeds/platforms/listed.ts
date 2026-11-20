import { listed } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ListedUrl = { kind: 'blog'; username: string }

const feeds = withHintLabels(listed.feeds)

export const parseListedUrl = (url: string): ListedUrl | undefined => {
  const page = listed.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'blog', username: page.params.username }
}

export const listedHandler: PlatformHandler = {
  match: (url) => {
    return parseListedUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseListedUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
