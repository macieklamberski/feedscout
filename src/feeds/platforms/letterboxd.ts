import { letterboxd } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type LetterboxdUrl = { kind: 'member'; username: string } | { kind: 'journal' }

const feeds = withHintLabels(letterboxd.feeds)

export const parseLetterboxdUrl = (url: string): LetterboxdUrl | undefined => {
  const page = letterboxd.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'journal') {
    return { kind: 'journal' }
  }

  return { kind: 'member', username: page.params.username }
}

export const letterboxdHandler: PlatformHandler = {
  match: (url) => {
    return parseLetterboxdUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLetterboxdUrl(url)

    if (!parsed) {
      return []
    }

    // The journal feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'journal') {
      return [feeds.getFeedEntry('journal')]
    }

    return [
      feeds.getFeedEntry('diary', { username: parsed.username }),
      feeds.getFeedEntry('journal'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
