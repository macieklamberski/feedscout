import { devto } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: community.
// Handler needed for: latest, posts, tag.

export type DevtoUrl =
  | { kind: 'profile'; owner: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'latest' }
  | { kind: 'home' }

const feeds = withHintLabels(devto.feeds)

export const parseDevtoUrl = (url: string): DevtoUrl | undefined => {
  const page = devto.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'profile') {
    return { kind: 'profile', owner: page.values.owner }
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.values.tag }
  }

  if (page.key === 'latest') {
    return { kind: 'latest' }
  }

  return { kind: 'home' }
}

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    return parseDevtoUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDevtoUrl(url)

    if (!parsed) {
      return []
    }

    // The community and latest feeds need no value from the page, so every page builds them after
    // its own feeds.
    if (parsed.kind === 'home') {
      return [feeds.getFeedEntry('community'), feeds.getFeedEntry('latest')]
    }

    if (parsed.kind === 'latest') {
      return [feeds.getFeedEntry('latest'), feeds.getFeedEntry('community')]
    }

    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tag: parsed.tag }),
        feeds.getFeedEntry('community'),
        feeds.getFeedEntry('latest'),
      ]
    }

    return [
      feeds.getFeedEntry('posts', { owner: parsed.owner }),
      feeds.getFeedEntry('community'),
      feeds.getFeedEntry('latest'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
