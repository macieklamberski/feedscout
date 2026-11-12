import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type SoundcloudUrl = { kind: 'user'; username: string }
export type SoundcloudPage = { kind: 'user'; userId: string }

export const hosts = ['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com']

const userIdRegex = /soundcloud:\/\/users:(\d+)/

const feeds = definePlatformFeeds([
  {
    key: 'soundcloud:tracks',
    template: 'https://feeds.soundcloud.com/users/soundcloud:users:{userId}/sounds.rss',
  },
  // The user path without sounds.rss serves the same feed.
  {
    key: 'soundcloud:tracks',
    template: 'https://feeds.soundcloud.com/users/soundcloud:users:{userId}',
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

// A profile path names the user, but the feed takes the numeric user id the page carries.
export const getSoundcloudPage = (
  url: string,
  content: string | undefined,
): SoundcloudPage | undefined => {
  if (!parseSoundcloudUrl(url)) {
    return
  }

  const userId = content?.match(userIdRegex)?.[1]

  if (!userId) {
    return
  }

  return { kind: 'user', userId }
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

    return [feeds.getFeedEntry('soundcloud:tracks', { userId: page.userId })]
  },

  // A user id is digits, and a word in its place answers 400.
  getFeedKey: (url) => {
    const [, userSegment] = getPathSegments(url)
    const userId = userSegment?.split(':').at(-1)

    if (!userId || !digitsRegex.test(userId)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
