import { dailymotion } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: channel, playlist, search, trending, videos.

export type DailymotionUrl =
  | { kind: 'user'; username: string }
  | { kind: 'playlist'; playlistId: string }
  | { kind: 'channel'; channel: string }
  | { kind: 'search'; query: string }
  | { kind: 'trending' }

const feeds = withHintLabels(dailymotion.feeds)

export const parseDailymotionUrl = (url: string): DailymotionUrl | undefined => {
  const page = dailymotion.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'trending') {
    return { kind: 'trending' }
  }

  if (page.key === 'playlist') {
    return { kind: 'playlist', playlistId: page.values.id }
  }

  if (page.key === 'search') {
    return { kind: 'search', query: page.values.query }
  }

  if (page.key === 'channel') {
    return { kind: 'channel', channel: page.values.channel }
  }

  return { kind: 'user', username: page.values.username }
}

export const dailymotionHandler: PlatformHandler = {
  match: (url) => {
    return parseDailymotionUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDailymotionUrl(url)

    if (!parsed) {
      return []
    }

    // The trending feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'trending') {
      return [feeds.getFeedEntry('trending')]
    }

    if (parsed.kind === 'playlist') {
      return [
        feeds.getFeedEntry('playlist', { id: parsed.playlistId }),
        feeds.getFeedEntry('trending'),
      ]
    }

    if (parsed.kind === 'search') {
      return [feeds.getFeedEntry('search', { query: parsed.query }), feeds.getFeedEntry('trending')]
    }

    if (parsed.kind === 'channel') {
      return [
        feeds.getFeedEntry('channel', { channel: parsed.channel }),
        feeds.getFeedEntry('trending'),
      ]
    }

    return [
      feeds.getFeedEntry('videos', { username: parsed.username }),
      feeds.getFeedEntry('trending'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
