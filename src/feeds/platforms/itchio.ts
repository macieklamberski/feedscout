import { itchio } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: devlog.
// Handler needed for: creator, devlogs, featured, games, genre, made-with, new, platform, sales, section, tag.

export type ItchioUrl =
  | { kind: 'game'; creator: string; game: string }
  | { kind: 'creator'; creator: string; sort?: string }
  | { kind: 'tag'; tag: string; sort?: string }
  | { kind: 'platform'; platform: string }
  | { kind: 'genre'; genre: string }
  | { kind: 'madeWith'; engine: string }
  | { kind: 'games'; sort?: string }
  | { kind: 'listing'; filters: string }
  | { kind: 'devlogs' }
  | { kind: 'section'; section: string }
  | { kind: 'home' }

const feeds = withHintLabels(itchio.feeds)

export const parseItchioUrl = (url: string): ItchioUrl | undefined => {
  const page = itchio.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'game') {
    return { kind: 'game', creator: page.values.creator, game: page.values.game }
  }

  // A sort and a section are read in any case, and their feeds are named in lower case.
  if (page.key === 'creator') {
    return { kind: 'creator', creator: page.values.creator, sort: page.values.sort?.toLowerCase() }
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.values.tag, sort: page.values.sort?.toLowerCase() }
  }

  if (page.key === 'listing') {
    return { kind: 'listing', filters: page.values.filters.join('/') }
  }

  if (page.key === 'platform') {
    return { kind: 'platform', platform: page.values.platform }
  }

  if (page.key === 'genre') {
    return { kind: 'genre', genre: page.values.genre }
  }

  if (page.key === 'madeWith') {
    return { kind: 'madeWith', engine: page.values.engine }
  }

  if (page.key === 'games') {
    return { kind: 'games', sort: page.values.sort?.toLowerCase() }
  }

  if (page.key === 'devlogs') {
    return { kind: 'devlogs' }
  }

  if (page.key === 'section') {
    return { kind: 'section', section: page.values.section.toLowerCase() }
  }

  return { kind: 'home' }
}

export const itchioHandler: PlatformHandler = {
  match: (url) => {
    return parseItchioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseItchioUrl(url)

    if (!parsed) {
      return []
    }

    // The curated feeds and the devlogs need no value from the page, so every page builds them
    // after its own feeds.
    if (parsed.kind === 'game') {
      const pageFeeds = feeds.forSite(url)

      if (!pageFeeds) {
        return []
      }

      return [
        pageFeeds.getFeedEntry('devlog', { game: parsed.game }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'creator') {
      return [
        feeds.getFeedEntry('creator', { creator: parsed.creator, sort: parsed.sort }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tag: parsed.tag, sort: parsed.sort }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'platform') {
      return [
        feeds.getFeedEntry('platform', { platform: parsed.platform }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'genre') {
      return [
        feeds.getFeedEntry('genre', { genre: parsed.genre }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'madeWith') {
      return [
        feeds.getFeedEntry('made-with', { engine: parsed.engine }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'listing') {
      return [
        feeds.getFeedEntry('games', { filters: parsed.filters }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'games' && parsed.sort) {
      return [
        feeds.getFeedEntry('games', { sort: parsed.sort }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'games') {
      return [
        feeds.getFeedEntry('games'),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'devlogs') {
      return [
        feeds.getFeedEntry('devlogs'),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
      ]
    }

    if (parsed.kind === 'section') {
      return [
        feeds.getFeedEntry('section', { section: parsed.section }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    return [
      feeds.getFeedEntry('featured'),
      feeds.getFeedEntry('new'),
      feeds.getFeedEntry('sales'),
      feeds.getFeedEntry('devlogs'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
