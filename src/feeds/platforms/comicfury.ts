import { comicfury } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: reader.
// Handler needed for: comic.

export type ComicfuryUrl = { kind: 'comic' | 'profile' | 'reader'; comic: string }

const feeds = withHintLabels(comicfury.feeds)

export const parseComicfuryUrl = (url: string): ComicfuryUrl | undefined => {
  const page = comicfury.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'profile') {
    return { kind: 'profile', comic: page.values.comic }
  }

  if (page.key === 'reader') {
    return { kind: 'reader', comic: page.values.comic }
  }

  return { kind: 'comic', comic: page.values.comic }
}

export const comicfuryHandler: PlatformHandler = {
  match: (url) => {
    return parseComicfuryUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseComicfuryUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'comic') {
      return [page.getFeedEntry('comic')]
    }

    if (parsed.kind === 'profile') {
      return [page.getFeedEntry('comic', { comic: parsed.comic })]
    }

    return [page.getFeedEntry('reader', { comic: parsed.comic })]
  },

  getFeedHint: feeds.getFeedHint,
}
