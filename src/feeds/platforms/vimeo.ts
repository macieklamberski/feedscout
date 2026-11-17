import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: channel, group, likes.
// Handler needed for: album, videos.

export type VimeoUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'group'; group: string }
  | { kind: 'album'; albumId: string }
  | { kind: 'likes'; username: string }
  | { kind: 'user'; username: string }

const hosts = ['vimeo.com', 'www.vimeo.com']

const albumSegments = ['album', 'showcase']

const feeds = definePlatformFeeds('vimeo', [
  { key: 'channel', main: 'https://vimeo.com/channels/{channel}/videos/rss' },
  { key: 'group', main: 'https://vimeo.com/groups/{group}/videos/rss' },
  { key: 'album', main: 'https://vimeo.com/album/{albumId}/rss' },
  { key: 'likes', main: 'https://vimeo.com/{username}/likes/rss' },
  {
    key: 'videos',
    main: 'https://vimeo.com/{username}/videos/rss',
    aliases: ['https://vimeo.com/{username}/videos/all/rss'],
  },
])

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
