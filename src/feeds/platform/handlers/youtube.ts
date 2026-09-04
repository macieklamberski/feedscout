import { isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// YouTube exposes per-channel Atom feeds at
// `youtube.com/feeds/videos.xml?channel_id=UC…`, and channel pages embed an
// HTML `<link rel="alternate">` pointing at it. The handler is needed to
// map the modern `/@handle`, `/user/{name}`, `/c/{name}`, `/shorts/…` and
// `/live/…` URL shapes onto the canonical channel feed, and to derive
// filtered playlist feeds (uploads, livestreams, shorts, popular, members).

const channelIdRegex = /"(?:channelId|externalId)":"(UC[a-zA-Z0-9_-]+)"/
const channelRegex = /^\/channel\/(UC[a-zA-Z0-9_-]+)/
const handleRegex = /^\/@([^/]+)/
const userRegex = /^\/user\/([^/]+)/
const customRegex = /^\/c\/([^/]+)/
const shortsRegex = /^\/shorts\/[\w-]+/
const liveRegex = /^\/live\/[\w-]+/
const channelPrefixRegex = /^UC/

const hosts = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
]

const extractChannelIdFromContent = (content: string): string | undefined => {
  const match = content.match(channelIdRegex)

  return match?.[1]
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

export const youtubeHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url, content) => {
    const parsedUrl = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Direct channel ID: /channel/UC...
    const channelMatch = parsedUrl.pathname.match(channelRegex)

    if (channelMatch?.[1]) {
      const channelId = channelMatch[1]

      pushChannelUris(uris, channelId)
    }

    // Playlist: /playlist?list=PL...
    const playlistId = parsedUrl.searchParams.get('list')

    if (playlistId) {
      uris.push({
        uri: feedUrl('playlist_id', playlistId),
        hint: composeHint('youtube:playlist'),
      })
    }

    // For URL formats that require content parsing to get channel ID:
    // - Handle: /@username
    // - Legacy user: /user/username
    // - Custom URL: /c/customname
    // - Video pages: /watch?v= or youtu.be/videoId
    // - Shorts: /shorts/videoId
    // - Live stream: /live/videoId
    if (uris.length === 0 && content) {
      const isVideoPage =
        parsedUrl.searchParams.has('v') ||
        (parsedUrl.hostname.includes('youtu.be') && parsedUrl.pathname.length > 1) ||
        shortsRegex.test(parsedUrl.pathname) ||
        liveRegex.test(parsedUrl.pathname)
      const needsContentParsing =
        isVideoPage ||
        parsedUrl.pathname.match(handleRegex) ||
        parsedUrl.pathname.match(userRegex) ||
        parsedUrl.pathname.match(customRegex)

      if (needsContentParsing) {
        const channelId = extractChannelIdFromContent(content)

        if (channelId) {
          pushChannelUris(uris, channelId)
        }
      }
    }

    return uris
  },
}
