import { pinterest } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: pins.

export type PinterestUrl =
  | { kind: 'user'; username: string }
  | { kind: 'tab'; username: string }
  | { kind: 'board'; username: string; board: string }

const feeds = withHintLabels(pinterest.feeds)

export const parsePinterestUrl = (url: string): PinterestUrl | undefined => {
  const page = pinterest.pages.read(url)

  if (!page) {
    return
  }

  const { username, board } = page.params

  if (page.key === 'board') {
    return { kind: 'board', username, board }
  }

  if (page.key === 'tab') {
    return { kind: 'tab', username }
  }

  return { kind: 'user', username }
}

export const pinterestHandler: PlatformHandler = {
  match: (url) => {
    return parsePinterestUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePinterestUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'board') {
      const params = { username: parsed.username, board: parsed.board }

      return [feeds.getFeedEntry('board', params)]
    }

    return [feeds.getFeedEntry('pins', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
