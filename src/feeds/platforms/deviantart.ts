import { deviantart } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: deviations, favorites, gallery.

export type DeviantartUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'favourites'; username: string }
  | { kind: 'folder'; username: string; folderId: string }
  | { kind: 'journal'; username: string }
  | { kind: 'profile'; username: string }
  | { kind: 'dailyDeviations' }

const feeds = withHintLabels(deviantart.feeds)

export const parseDeviantartUrl = (url: string): DeviantartUrl | undefined => {
  const page = deviantart.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'dailyDeviations') {
    return { kind: 'dailyDeviations' }
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.params.tag }
  }

  if (page.key === 'favourites') {
    return { kind: 'favourites', username: page.params.username }
  }

  if (page.key === 'folder') {
    return { kind: 'folder', username: page.params.username, folderId: page.params.folderId }
  }

  if (page.key === 'journal') {
    return { kind: 'journal', username: page.params.username }
  }

  return { kind: 'profile', username: page.params.username }
}

export const deviantartHandler: PlatformHandler = {
  match: (url) => {
    return parseDeviantartUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDeviantartUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'dailyDeviations' || parsed.kind === 'tag') {
      return []
    }

    if (parsed.kind === 'favourites') {
      return [feeds.getFeedEntry('favorites', { username: parsed.username })]
    }

    if (parsed.kind === 'folder') {
      const params = { username: parsed.username, folderId: parsed.folderId }

      return [feeds.getFeedEntry('gallery', params)]
    }

    if (parsed.kind === 'journal') {
      return [feeds.getFeedEntry('journal', { username: parsed.username })]
    }

    return [feeds.getFeedEntry('deviations', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
