import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers channel, group, likes, user, userVideos (guess, html).
// Handler needed for: album.

export type VimeoUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'group'; group: string }
  | { kind: 'album'; albumId: string }
  | { kind: 'likes'; username: string }
  | { kind: 'user'; username: string }

const hosts = ['vimeo.com', 'www.vimeo.com']

const numericRegex = /^\d+$/

const albumSegments = ['album', 'showcase']

export const parseVimeoUrl = (url: string): VimeoUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [first, second] = getPathSegments(url)

  // Channel page: vimeo.com/channels/{channel}
  if (isAnyOf(first, 'channels') && second) {
    return { kind: 'channel', channel: second }
  }

  // Group page: vimeo.com/groups/{group}
  if (isAnyOf(first, 'groups') && second) {
    return { kind: 'group', group: second }
  }

  // Album/showcase: vimeo.com/album/{id} or vimeo.com/showcase/{id}. Only /album/{id}/rss
  // returns RSS; /showcase/{id}/rss returns 404. /album/{id} 301-redirects to
  // /showcase/{id} in the browser, so users will most often paste the showcase URL.
  if (isAnyOf(first, albumSegments) && second) {
    if (!numericRegex.test(second)) {
      return
    }

    return { kind: 'album', albumId: second }
  }

  // A numeric first segment is a video id.
  if (!first || numericRegex.test(first)) {
    return
  }

  if (isAnyOf(second, 'likes')) {
    return { kind: 'likes', username: first }
  }

  return { kind: 'user', username: first }
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

    const { origin } = new URL(url)

    if (parsed.kind === 'channel') {
      return [
        {
          uri: `${origin}/channels/${parsed.channel}/videos/rss`,
          hint: composeHint('vimeo:channel'),
        },
      ]
    }

    if (parsed.kind === 'group') {
      return [
        {
          uri: `${origin}/groups/${parsed.group}/videos/rss`,
          hint: composeHint('vimeo:group'),
        },
      ]
    }

    if (parsed.kind === 'album') {
      return [
        {
          uri: `${origin}/album/${parsed.albumId}/rss`,
          hint: composeHint('vimeo:album'),
        },
      ]
    }

    const videos = {
      uri: `${origin}/${parsed.username}/videos/rss`,
      hint: composeHint('vimeo:videos'),
    }

    if (parsed.kind === 'likes') {
      return [
        { uri: `${origin}/${parsed.username}/likes/rss`, hint: composeHint('vimeo:likes') },
        videos,
      ]
    }

    return [videos]
  },
}
