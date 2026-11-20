import { flipboard } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type FlipboardUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'magazine'; username: string; magazine: string }
  | { kind: 'topic'; topic: string }

const feeds = withHintLabels(flipboard.feeds)

export const parseFlipboardUrl = (url: string): FlipboardUrl | undefined => {
  const page = flipboard.pages.read(url)

  if (!page) {
    return
  }

  const { username, magazine, topic } = page.params

  if (page.key === 'topic') {
    return { kind: 'topic', topic }
  }

  if (page.key === 'profile') {
    return { kind: 'profile', username }
  }

  // Storyboards share the magazine URL shape and its .rss feed.
  return { kind: 'magazine', username, magazine }
}

export const flipboardHandler: PlatformHandler = {
  match: (url) => {
    return parseFlipboardUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFlipboardUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'profile') {
      return [feeds.getFeedEntry('profile', { username: parsed.username })]
    }

    if (parsed.kind === 'magazine') {
      const { username, magazine } = parsed

      return [feeds.getFeedEntry('magazine', { username, magazine })]
    }

    return [feeds.getFeedEntry('topic', { topic: parsed.topic })]
  },

  getFeedHint: feeds.getFeedHint,
}
