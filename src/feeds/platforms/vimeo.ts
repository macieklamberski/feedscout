import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

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

const feeds = definePlatformFeeds([
  { key: 'vimeo:channel', template: 'https://vimeo.com/channels/{channel}/videos/rss' },
  { key: 'vimeo:group', template: 'https://vimeo.com/groups/{group}/videos/rss' },
  { key: 'vimeo:album', template: 'https://vimeo.com/album/{albumId}/rss' },
  { key: 'vimeo:likes', template: 'https://vimeo.com/{username}/likes/rss' },
  { key: 'vimeo:videos', template: 'https://vimeo.com/{username}/videos/rss' },
  { key: 'vimeo:videos', template: 'https://vimeo.com/{username}/videos/all/rss', isAlias: true },
])

const feedKeys: Record<VimeoUrl['kind'], string> = {
  channel: 'vimeo:channel',
  group: 'vimeo:group',
  album: 'vimeo:album',
  likes: 'vimeo:likes',
  user: 'vimeo:videos',
}

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

    if (parsed.kind === 'channel') {
      return [feeds.getFeedEntry('vimeo:channel', { channel: parsed.channel })]
    }

    if (parsed.kind === 'group') {
      return [feeds.getFeedEntry('vimeo:group', { group: parsed.group })]
    }

    if (parsed.kind === 'album') {
      return [feeds.getFeedEntry('vimeo:album', { albumId: parsed.albumId })]
    }

    if (parsed.kind === 'likes') {
      return [
        feeds.getFeedEntry('vimeo:likes', { username: parsed.username }),
        feeds.getFeedEntry('vimeo:videos', { username: parsed.username }),
      ]
    }

    return [feeds.getFeedEntry('vimeo:videos', { username: parsed.username })]
  },

  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)
    const page = parseVimeoUrl(url)

    // The feed must read as the page kind that emits its key: `/123/videos/rss` is a video's and
    // `/channels/likes/rss` a channel's, neither a user's feed.
    if (!hint || !page || feedKeys[page.kind] !== hint.key) {
      return
    }

    return hint
  },
}
