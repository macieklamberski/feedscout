import { tildes } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: group, tag.
// Handler needed for: topics.

export type TildesUrl =
  | { kind: 'group'; group: string; tag?: string }
  | { kind: 'home'; tag?: string }

const feeds = withHintLabels(tildes.feeds)

export const parseTildesUrl = (url: string): TildesUrl | undefined => {
  const page = tildes.pages.read(url)

  if (!page) {
    return
  }

  const { group, tag } = page.params

  if (page.key === 'group') {
    return { kind: 'group', group, tag }
  }

  return { kind: 'home', tag }
}

export const tildesHandler: PlatformHandler = {
  match: (url) => {
    return parseTildesUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTildesUrl(url)

    if (!parsed) {
      return []
    }

    const { tag } = parsed

    // The site-wide topics feed needs no value from the page, so every page builds it after its own
    // feeds.
    if (parsed.kind === 'group') {
      const { group } = parsed

      if (tag) {
        return [
          feeds.getFeedEntry('group-tag', { group, tag }, 'rss'),
          feeds.getFeedEntry('group-tag', { group, tag }, 'atom'),
          feeds.getFeedEntry('topics', {}, 'rss'),
          feeds.getFeedEntry('topics', {}, 'atom'),
        ]
      }

      return [
        feeds.getFeedEntry('group', { group }, 'rss'),
        feeds.getFeedEntry('group', { group }, 'atom'),
        feeds.getFeedEntry('topics', {}, 'rss'),
        feeds.getFeedEntry('topics', {}, 'atom'),
      ]
    }

    if (tag) {
      return [
        feeds.getFeedEntry('tag', { tag }, 'rss'),
        feeds.getFeedEntry('tag', { tag }, 'atom'),
        feeds.getFeedEntry('topics', {}, 'rss'),
        feeds.getFeedEntry('topics', {}, 'atom'),
      ]
    }

    return [feeds.getFeedEntry('topics', {}, 'rss'), feeds.getFeedEntry('topics', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
