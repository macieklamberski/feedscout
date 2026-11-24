import { note } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: blog, featured.
// Handler needed for: hashtag, magazine.

export type NoteUrl =
  | { kind: 'hashtag'; tag: string }
  | { kind: 'magazine'; username: string; magazine: string }
  | { kind: 'note'; username: string }
  | { kind: 'user'; username: string }
  | { kind: 'home' }

const feeds = withHintLabels(note.feeds)

export const parseNoteUrl = (url: string): NoteUrl | undefined => {
  const page = note.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'hashtag') {
    return { kind: 'hashtag', tag: page.params.tag }
  }

  if (page.key === 'magazine') {
    return { kind: 'magazine', username: page.params.username, magazine: page.params.magazine }
  }

  if (page.key === 'note') {
    return { kind: 'note', username: page.params.username }
  }

  if (page.key === 'home') {
    return { kind: 'home' }
  }

  return { kind: 'user', username: page.params.username }
}

export const noteHandler: PlatformHandler = {
  match: (url) => {
    return parseNoteUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNoteUrl(url)

    if (!parsed) {
      return []
    }

    // The featured notes feed needs no value from the page, so every page builds it after its own
    // feeds.
    if (parsed.kind === 'hashtag') {
      return [feeds.getFeedEntry('hashtag', { tag: parsed.tag }), feeds.getFeedEntry('featured')]
    }

    if (parsed.kind === 'magazine') {
      return [
        feeds.getFeedEntry('magazine', {
          username: parsed.username,
          magazine: parsed.magazine,
        }),
        feeds.getFeedEntry('featured'),
      ]
    }

    // A note page leads to its author's blog feed.
    if (parsed.kind === 'note' || parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('blog', { username: parsed.username }),
        feeds.getFeedEntry('featured'),
      ]
    }

    return [feeds.getFeedEntry('featured')]
  },

  getFeedHint: feeds.getFeedHint,
}
