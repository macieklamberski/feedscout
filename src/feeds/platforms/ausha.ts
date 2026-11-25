import { ausha } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findUrls } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: podcast.

export type AushaUrl = { kind: 'show' }
export type AushaPage = { kind: 'show'; feedId: string }

const feeds = withHintLabels(ausha.feeds)

// The feed id is opaque: show and episode pages carry it only in the markup.
const getLinkedFeedId = (content: string): string | undefined => {
  for (const url of findUrls(content)) {
    const feed = ausha.feeds.readUrl(url)

    if (feed?.key === 'podcast') {
      return feed.values.feedId
    }
  }
}

export const parseAushaUrl = (url: string): AushaUrl | undefined => {
  const page = ausha.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'show' }
}

export const getAushaPage = (url: string, content: string | undefined): AushaPage | undefined => {
  const parsed = parseAushaUrl(url)
  const feedId = getLinkedFeedId(content ?? '')

  if (!parsed || !feedId) {
    return
  }

  return { kind: 'show', feedId }
}

export const aushaHandler: PlatformHandler = {
  match: (url) => {
    return parseAushaUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getAushaPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { feedId: page.feedId })]
  },

  getFeedHint: feeds.getFeedHint,
}
