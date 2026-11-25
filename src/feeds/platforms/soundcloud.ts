import { soundcloud } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: tracks.

export type SoundcloudUrl = { kind: 'user'; username: string }
export type SoundcloudPage =
  | { kind: 'user'; userId: string }
  | { kind: 'playlist'; playlistId: string }

const userIdRegex = /soundcloud:\/\/users:(\d+)/
const playlistIdRegex = /soundcloud:\/\/playlists:(\d+)/

const feeds = withHintLabels(soundcloud.feeds)

export const parseSoundcloudUrl = (url: string): SoundcloudUrl | undefined => {
  const page = soundcloud.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'user', username: page.values.username }
}

// A profile or playlist path names it by slug, but the feed takes the numeric id the page carries.
export const getSoundcloudPage = (
  url: string,
  content: string | undefined,
): SoundcloudPage | undefined => {
  if (!parseSoundcloudUrl(url)) {
    return
  }

  const userId = content?.match(userIdRegex)?.[1]

  if (userId) {
    return { kind: 'user', userId }
  }

  const playlistId = content?.match(playlistIdRegex)?.[1]

  if (playlistId) {
    return { kind: 'playlist', playlistId }
  }
}

export const soundcloudHandler: PlatformHandler = {
  match: (url) => {
    return parseSoundcloudUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSoundcloudPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'playlist') {
      return [feeds.getFeedEntry('playlist', { playlistId: page.playlistId })]
    }

    return [feeds.getFeedEntry('tracks', { userId: page.userId })]
  },

  getFeedHint: feeds.getFeedHint,
}
