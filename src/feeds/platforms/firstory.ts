import { firstory } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findUrls } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const feeds = withHintLabels(firstory.feeds)

// The feed is keyed by the show's cuid, and the vanity-slug form of it answers 403.
// Show, episode and firstory.cc pages each link the show's feed.
const getLinkedCuid = (content: string): string | undefined => {
  for (const url of findUrls(content)) {
    const feed = firstory.feeds.read(url)

    if (feed?.key === 'podcast') {
      return feed.params.cuid
    }
  }
}

export type FirstoryPage = { kind: 'show'; cuid: string }

export const getFirstoryPage = (
  url: string,
  content: string | undefined,
): FirstoryPage | undefined => {
  if (!firstory.pages.read(url)) {
    return
  }

  const cuid = getLinkedCuid(content ?? '')

  if (!cuid) {
    return
  }

  return { kind: 'show', cuid }
}

export const firstoryHandler: PlatformHandler = {
  match: (url, content) => {
    return getFirstoryPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getFirstoryPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { cuid: page.cuid })]
  },

  getFeedHint: feeds.getFeedHint,
}
