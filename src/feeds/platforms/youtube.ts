import { isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers channelById, custom, handle, user.
// Handler needed for: music, shortLink, watch.

export type YoutubeUrl =
  | { kind: 'channel'; channelId?: string; playlistId?: string }
  | { kind: 'watch'; playlistId?: string }
  | { kind: 'short'; playlistId?: string }
  | { kind: 'player'; playlistId?: string }
  | { kind: 'playlist'; playlistId: string }

export const hosts = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]
const shortLinkHosts = ['youtu.be', 'www.youtu.be']

// A channel page also embeds the IDs of the channels it features, and a bare "channelId" matches
// one of those before the page's own, which sits under "externalId". A video page has no
// "externalId", and its uploader sits under "externalChannelId" and "channelId".
const channelIdRegexes = [
  /"externalId":"(UC[a-zA-Z0-9_-]+)"/,
  /"externalChannelId":"(UC[a-zA-Z0-9_-]+)"/,
  /"channelId":"(UC[a-zA-Z0-9_-]+)"/,
]
const channelRegex = /^\/channel\/(UC[a-zA-Z0-9_-]+)/
const channelPathRegexes = [/^\/@[^/]+/, /^\/user\/[^/]+/, /^\/c\/[^/]+/]
const shortsRegex = /^\/shorts\/[\w-]+/
const liveRegex = /^\/live\/[\w-]+/
const watchRegex = /^\/watch\/?$/
const channelPrefixRegex = /^UC/

const extractChannelIdFromContent = (content: string): string | undefined => {
  for (const regex of channelIdRegexes) {
    const match = content.match(regex)

    if (match?.[1]) {
      return match[1]
    }
  }
}

// Convert channel ID to playlist IDs for filtered feeds.
// YouTube playlist prefixes: https://stackoverflow.com/a/77816885.
const playlistPrefix = (prefix: string, channelId: string): string => {
  return channelId.replace(channelPrefixRegex, prefix)
}

// YouTube also supports a legacy ?user=username feed parameter, but it only
// works with old-style usernames (not modern @handles) and returns the same
// Atom content as ?channel_id=. YouTube's own autodiscovery always uses
// channel_id, so we treat it as the canonical format.
const feedUrl = (param: string, value: string): string => {
  return `https://www.youtube.com/feeds/videos.xml?${param}=${value}`
}

const pushChannelUris = (uris: Array<DiscoverUriEntry>, channelId: string): void => {
  uris.push({
    uri: [
      feedUrl('channel_id', channelId),
      feedUrl('playlist_id', playlistPrefix('UU', channelId)),
    ],
    hint: composeHint('youtube:all'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UULF', channelId)),
    hint: composeHint('youtube:videos'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UUSH', channelId)),
    hint: composeHint('youtube:shorts'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UULV', channelId)),
    hint: composeHint('youtube:live'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UULP', channelId)),
    hint: composeHint('youtube:popular-videos'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UUPS', channelId)),
    hint: composeHint('youtube:popular-shorts'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UUPV', channelId)),
    hint: composeHint('youtube:popular-live'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UUMO', channelId)),
    hint: composeHint('youtube:member-videos'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UUMS', channelId)),
    hint: composeHint('youtube:member-shorts'),
  })
  uris.push({
    uri: feedUrl('playlist_id', playlistPrefix('UUMV', channelId)),
    hint: composeHint('youtube:member-live'),
  })
}

export const parseYoutubeUrl = (url: string): YoutubeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const playlistId = searchParams.get('list') ?? undefined
  const channelId = pathname.match(channelRegex)?.[1]

  if (channelId) {
    return { kind: 'channel', channelId, playlistId }
  }

  if (channelPathRegexes.some((regex) => regex.test(pathname))) {
    return { kind: 'channel', playlistId }
  }

  if (
    (watchRegex.test(pathname) && searchParams.has('v')) ||
    (isHostOf(parsedUrl, shortLinkHosts) && pathname.length > 1) ||
    liveRegex.test(pathname)
  ) {
    return { kind: 'watch', playlistId }
  }

  if (shortsRegex.test(pathname)) {
    return { kind: 'short', playlistId }
  }

  if (searchParams.has('v')) {
    return { kind: 'player', playlistId }
  }

  if (playlistId) {
    return { kind: 'playlist', playlistId }
  }
}

export const youtubeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url, content) => {
    const parsed = parseYoutubeUrl(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed?.kind === 'channel' && parsed.channelId) {
      pushChannelUris(uris, parsed.channelId)
    }

    if (parsed?.playlistId) {
      uris.push({
        uri: feedUrl('playlist_id', parsed.playlistId),
        hint: composeHint('youtube:playlist'),
      })
    }

    // Handle, legacy user, custom URL and video pages carry the channel ID only in their content.
    if (uris.length === 0 && content && parsed && parsed.kind !== 'playlist') {
      const channelId = extractChannelIdFromContent(content)

      if (channelId) {
        pushChannelUris(uris, channelId)
      }
    }

    return uris
  },
}
