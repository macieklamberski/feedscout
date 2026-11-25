import { libsyn } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type LibsynUrl =
  | { kind: 'feed'; showId: string }
  | { kind: 'site'; showId: string }
  | { kind: 'podcast'; slug: string }

const feeds = withHintLabels(libsyn.feeds)

export const parseLibsynUrl = (url: string): LibsynUrl | undefined => {
  const page = libsyn.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'feed') {
    return { kind: 'feed', showId: page.values.showId }
  }

  if (page.key === 'site') {
    return { kind: 'site', showId: page.values.showId }
  }

  return { kind: 'podcast', slug: page.values.slug }
}

export const libsynHandler: PlatformHandler = {
  match: (url) => {
    return parseLibsynUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLibsynUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'feed' || parsed.kind === 'site') {
      return [feeds.getFeedEntry('podcast', { showId: parsed.showId })]
    }

    const page = feeds.forSite(url)

    if (!page) {
      return []
    }

    return [page.getFeedEntry('podcast')]
  },

  getFeedHint: feeds.getFeedHint,
}
