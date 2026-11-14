import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type SoundcloudUrl = { kind: 'user'; username: string }
export type SoundcloudPage =
  | { kind: 'user'; userId: string }
  | { kind: 'playlist'; playlistId: string }

export const hosts = ['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com']

const userIdRegex = /soundcloud:\/\/users:(\d+)/
const playlistIdRegex = /soundcloud:\/\/playlists:(\d+)/
const feedSegmentRegex = /^soundcloud:(?:users|sets|playlists):\d+$/i

const feeds = definePlatformFeeds([
  {
    key: 'soundcloud:tracks',
    template: 'https://feeds.soundcloud.com/users/soundcloud:users:{userId}/sounds.rss',
  },
  // The user path without sounds.rss serves the same feed.
  {
    key: 'soundcloud:tracks',
    template: 'https://feeds.soundcloud.com/users/soundcloud:users:{userId}',
    isAlias: true,
  },
  {
    key: 'soundcloud:playlist',
    template: 'https://feeds.soundcloud.com/playlists/soundcloud:sets:{playlistId}/sounds.rss',
  },
  // The playlist path without sounds.rss, and with playlists in place of sets, serve the same feed.
  {
    key: 'soundcloud:playlist',
    template: 'https://feeds.soundcloud.com/playlists/soundcloud:sets:{playlistId}',
    isAlias: true,
  },
  {
    key: 'soundcloud:playlist',
    template: 'https://feeds.soundcloud.com/playlists/soundcloud:playlists:{playlistId}/sounds.rss',
    isAlias: true,
  },
])

export const parseSoundcloudUrl = (url: string): SoundcloudUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [username] = getPathSegments(parsedUrl)

  // A permalink holds only letters, digits, _ and -, so robots.txt is a file, not a user.
  if (!username || !wordOrHyphenRegex.test(username)) {
    return
  }

  return { kind: 'user', username }
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
      return [feeds.getFeedEntry('soundcloud:playlist', { playlistId: page.playlistId })]
    }

    return [feeds.getFeedEntry('soundcloud:tracks', { userId: page.userId })]
  },

  // A user or playlist id is digits, and a word in its place answers 400 or 404.
  getFeedHint: (url) => {
    const [, feedSegment] = getPathSegments(url)

    if (!feedSegment || !feedSegmentRegex.test(feedSegment)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
