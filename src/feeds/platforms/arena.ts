import { arena } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: channel, profile.
// Handler needed for: editorial.

export type ArenaUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'channel'; username: string; channel: string }
  | { kind: 'editorial' }

const feeds = withHintLabels(arena.feeds)

export const parseArenaUrl = (url: string): ArenaUrl | undefined => {
  const page = arena.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'editorial') {
    return { kind: 'editorial' }
  }

  if (page.key === 'channel') {
    return { kind: 'channel', username: page.params.username, channel: page.params.channel }
  }

  return { kind: 'profile', username: page.params.username }
}

export const arenaHandler: PlatformHandler = {
  match: (url) => {
    return parseArenaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseArenaUrl(url)

    if (!parsed) {
      return []
    }

    // The editorial feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'editorial') {
      return [feeds.getFeedEntry('editorial')]
    }

    if (parsed.kind === 'channel') {
      const params = { username: parsed.username, channel: parsed.channel }

      return [feeds.getFeedEntry('channel', params), feeds.getFeedEntry('editorial')]
    }

    return [
      feeds.getFeedEntry('profile', { username: parsed.username }),
      feeds.getFeedEntry('editorial'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
