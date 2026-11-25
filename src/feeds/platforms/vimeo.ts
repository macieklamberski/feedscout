import { vimeo } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: channel, group, likes.
// Handler needed for: album, videos.

export type VimeoUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'group'; group: string }
  | { kind: 'album'; albumId: string }
  | { kind: 'likes'; username: string }
  | { kind: 'user'; username: string }

const feeds = withHintLabels(vimeo.feeds)

export const parseVimeoUrl = (url: string): VimeoUrl | undefined => {
  const page = vimeo.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'channel') {
    return { kind: 'channel', channel: page.values.channel }
  }

  if (page.key === 'group') {
    return { kind: 'group', group: page.values.group }
  }

  if (page.key === 'album') {
    return { kind: 'album', albumId: page.values.albumId }
  }

  if (page.key === 'likes') {
    return { kind: 'likes', username: page.values.username }
  }

  return { kind: 'user', username: page.values.username }
}

export const vimeoHandler: PlatformHandler = {
  match: (url) => {
    return parseVimeoUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseVimeoUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'channel') {
      return [feeds.getFeedEntry('channel', { channel: parsed.channel })]
    }

    if (parsed.kind === 'group') {
      return [feeds.getFeedEntry('group', { group: parsed.group })]
    }

    if (parsed.kind === 'album') {
      return [feeds.getFeedEntry('album', { albumId: parsed.albumId })]
    }

    if (parsed.kind === 'likes') {
      return [
        feeds.getFeedEntry('likes', { username: parsed.username }),
        feeds.getFeedEntry('videos', { username: parsed.username }),
      ]
    }

    return [feeds.getFeedEntry('videos', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
