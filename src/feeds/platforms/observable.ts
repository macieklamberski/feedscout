import { observable } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: collection, notebooks, recent, trending.

export type ObservableUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'collection'; owner: string; collection: string }
  | { kind: 'recent' }
  | { kind: 'trending' }

const feeds = withHintLabels(observable.feeds)

export const parseObservableUrl = (url: string): ObservableUrl | undefined => {
  const page = observable.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'recent') {
    return { kind: 'recent' }
  }

  if (page.key === 'trending') {
    return { kind: 'trending' }
  }

  if (page.key === 'collection') {
    return { kind: 'collection', owner: page.params.owner, collection: page.params.collection }
  }

  return { kind: 'user', owner: page.params.owner }
}

export const observableHandler: PlatformHandler = {
  match: (url) => {
    return parseObservableUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseObservableUrl(url)

    if (!parsed) {
      return []
    }

    // The recent and trending feeds need no value from the page, so every page builds them after
    // its own feeds.
    if (parsed.kind === 'recent') {
      return [feeds.getFeedEntry('recent'), feeds.getFeedEntry('trending')]
    }

    if (parsed.kind === 'trending') {
      return [feeds.getFeedEntry('trending'), feeds.getFeedEntry('recent')]
    }

    if (parsed.kind === 'collection') {
      const params = { owner: parsed.owner, collection: parsed.collection }

      return [
        feeds.getFeedEntry('collection', params),
        feeds.getFeedEntry('recent'),
        feeds.getFeedEntry('trending'),
      ]
    }

    return [
      feeds.getFeedEntry('notebooks', { owner: parsed.owner }),
      feeds.getFeedEntry('recent'),
      feeds.getFeedEntry('trending'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
