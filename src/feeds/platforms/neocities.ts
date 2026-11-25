import { neocities } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: updates.

export type NeocitiesUrl = { kind: 'site'; username: string }

const feeds = withHintLabels(neocities.feeds)

export const parseNeocitiesUrl = (url: string): NeocitiesUrl | undefined => {
  const page = neocities.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'site', username: page.values.username }
}

export const neocitiesHandler: PlatformHandler = {
  match: (url) => {
    return parseNeocitiesUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNeocitiesUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('updates', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
