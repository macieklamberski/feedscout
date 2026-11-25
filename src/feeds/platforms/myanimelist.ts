import { myanimelist } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: anime, blog, featured, manga, news, recently-read, recently-watched.

export type MyanimelistUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'user'; username: string }
  | { kind: 'news' }
  | { kind: 'featured' }

const feeds = withHintLabels(myanimelist.feeds)

export const parseMyanimelistUrl = (url: string): MyanimelistUrl | undefined => {
  const page = myanimelist.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'profile') {
    return { kind: 'profile', username: page.values.username }
  }

  if (page.key === 'user') {
    return { kind: 'user', username: page.values.username }
  }

  if (page.key === 'featured') {
    return { kind: 'featured' }
  }

  return { kind: 'news' }
}

export const myanimelistHandler: PlatformHandler = {
  match: (url) => {
    return parseMyanimelistUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMyanimelistUrl(url)

    if (!parsed) {
      return []
    }

    // The news and featured articles feeds need no value from the page, so every page builds them
    // after its own feeds.
    if (parsed.kind === 'news') {
      return [feeds.getFeedEntry('news'), feeds.getFeedEntry('featured')]
    }

    if (parsed.kind === 'featured') {
      return [feeds.getFeedEntry('featured'), feeds.getFeedEntry('news')]
    }

    const { username } = parsed

    return [
      feeds.getFeedEntry('anime', { username }),
      feeds.getFeedEntry('manga', { username }),
      feeds.getFeedEntry('recently-watched', { username }),
      feeds.getFeedEntry('recently-read', { username }),
      feeds.getFeedEntry('blog', { username }),
      feeds.getFeedEntry('news'),
      feeds.getFeedEntry('featured'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
