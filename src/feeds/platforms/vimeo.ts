import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, digitsRegex } from '../../common/utils.js'

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

const albumSegments = ['album', 'showcase']

export const parseVimeoUrl = (url: string): VimeoUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [routeOrUsername, nameOrRoute] = getPathSegments(url)

  // Channel page: vimeo.com/channels/{channel}
  if (isAnyOf(routeOrUsername, 'channels') && nameOrRoute) {
    return { kind: 'channel', channel: nameOrRoute }
  }

  // Group page: vimeo.com/groups/{group}
  if (isAnyOf(routeOrUsername, 'groups') && nameOrRoute) {
    return { kind: 'group', group: nameOrRoute }
  }

  // Album/showcase: vimeo.com/album/{id} or vimeo.com/showcase/{id}. Only /album/{id}/rss
  // returns RSS; /showcase/{id}/rss returns 404. /album/{id} 301-redirects to
  // /showcase/{id} in the browser, so users will most often paste the showcase URL.
  if (isAnyOf(routeOrUsername, albumSegments) && nameOrRoute) {
    if (!digitsRegex.test(nameOrRoute)) {
      return
    }

    return { kind: 'album', albumId: nameOrRoute }
  }

  // A numeric first segment is a video id.
  if (!routeOrUsername || digitsRegex.test(routeOrUsername)) {
    return
  }

  if (isAnyOf(nameOrRoute, 'likes')) {
    return { kind: 'likes', username: routeOrUsername }
  }

  return { kind: 'user', username: routeOrUsername }
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
