import { getQueryParam, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, formatSuffixRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers channelById, custom, handle, user.
// Handler needed for: live, music, playlist, shortLink, shorts, watch.

export type YoutubeUrl =
  | { kind: 'channel'; channelId?: string; playlistId?: string }
  | { kind: 'watch'; playlistId?: string }
  | { kind: 'short'; playlistId?: string }
  | { kind: 'player'; playlistId?: string }
  | { kind: 'playlist'; playlistId: string }
export type YoutubePage =
  | { kind: 'channel' | 'watch' | 'short' | 'player'; channelId?: string; playlistId?: string }
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
const feedUrl = 'https://www.youtube.com/feeds/videos.xml'

// A channel page also embeds the IDs of the channels it features, and a bare "channelId" matches
// one of those before the page's own, which sits under "externalId". A video page has no
// "externalId", and its uploader sits under "externalChannelId" and "channelId".
const channelIdRegexes = [
  /"externalId":"(UC[a-zA-Z0-9_-]+)"/,
  /"externalChannelId":"(UC[a-zA-Z0-9_-]+)"/,
  /"channelId":"(UC[a-zA-Z0-9_-]+)"/,
]
const channelPathRegexes = [/^\/@[^/]+/, /^\/user\/[^/]+/i, /^\/c\/[^/]+/i]

const channelRegex = /^\/channel\/([^/]+)/i
const shortsRegex = /^\/shorts\/[\w-]+/i
const liveRegex = /^\/live\/[\w-]+/i
const watchRegex = /^\/watch\/?$/i
const channelPrefixRegex = /^UC/
// Channel IDs are case-sensitive, so the ID is checked apart from the case-insensitive route.
const channelIdFormatRegex = /^UC[\w-]+$/
// Watch Later, Liked videos and the Music likes are private, and a mix is generated per viewer, so
// none of them has a feed. RDCLAK lists are curated YouTube Music playlists, not mixes.
const feedlessListRegex = /^(?:WL|LL|LM)$|^RD(?!CLAK)/
// A channel ID is UC and 22 characters, so the fixed length tells UULF{id} apart from UU{id}
// whose ID starts with LF.
const uploadsPlaylistRegex = /^(UU(?:LF|SH|LV|LP|PS|PV|MO|MS|MV)?)[\w-]{22}$/

// The playlists YouTube derives from a channel, the UC of its ID replaced by the prefix. The bare
// UU list is the channel's uploads, the second spelling of the channel feed.
// See: https://stackoverflow.com/a/77816885.
const uploadsPlaylistKeys: Record<string, string> = {
  UULF: 'youtube:videos',
  UUSH: 'youtube:shorts',
  UULV: 'youtube:live',
  UULP: 'youtube:popular-videos',
  UUPS: 'youtube:popular-shorts',
  UUPV: 'youtube:popular-live',
  UUMO: 'youtube:member-videos',
  UUMS: 'youtube:member-shorts',
  UUMV: 'youtube:member-live',
}
// YouTube also supports a legacy ?user=username feed parameter, but it only works with old-style
// usernames (not modern @handles) and returns the same Atom content as ?channel_id=. YouTube's own
// autodiscovery always uses channel_id, so we treat it as the canonical format and only claim the
// legacy one.
const feeds = definePlatformFeeds([
  { key: 'youtube:all', template: `${feedUrl}?channel_id={channelId}` },
  { key: 'youtube:all', template: `${feedUrl}?user={user}` },
  { key: 'youtube:playlist', template: `${feedUrl}?playlist_id={playlistId}` },
  ...Object.values(uploadsPlaylistKeys).map((key) => {
    return { key, template: `${feedUrl}?playlist_id={playlistId}` }
  }),
])

const extractChannelIdFromContent = (content: string): string | undefined => {
  for (const regex of channelIdRegexes) {
    const match = content.match(regex)

    if (match?.[1]) {
      return match[1]
    }
  }
}

const toUploadsPlaylistId = (prefix: string, channelId: string): string => {
  return channelId.replace(channelPrefixRegex, prefix)
}

// An uploads list is one of the channel's feeds, whether a page or a feed URL names it.
const getPlaylistKey = (playlistId: string | undefined): string => {
  const uploadsPrefix = playlistId?.match(uploadsPlaylistRegex)?.[1]

  if (uploadsPrefix === 'UU') {
    return 'youtube:all'
  }

  if (uploadsPrefix) {
    return uploadsPlaylistKeys[uploadsPrefix]
  }

  return 'youtube:playlist'
}

const getChannelUris = (channelId: string): Array<DiscoverUriEntry> => {
  return [
    {
      uri: [
        feeds.getFeedUrl('youtube:all', { channelId }),
        feeds.getFeedUrl('youtube:playlist', { playlistId: toUploadsPlaylistId('UU', channelId) }),
      ],
      hint: composeHint('youtube:all'),
    },
    ...Object.entries(uploadsPlaylistKeys).map(([prefix, key]) => {
      return feeds.getFeedEntry(key, { playlistId: toUploadsPlaylistId(prefix, channelId) })
    }),
  ]
}

export const parseYoutubeUrl = (url: string): YoutubeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const listId = getQueryParam(searchParams, 'list')
  const playlistId = listId && !feedlessListRegex.test(listId) ? listId : undefined
  const rawChannelId = pathname.match(channelRegex)?.[1]?.replace(formatSuffixRegex, '')
  const channelId =
    rawChannelId && channelIdFormatRegex.test(rawChannelId) ? rawChannelId : undefined

  if (channelId) {
    return { kind: 'channel', channelId, playlistId }
  }

  if (channelPathRegexes.some((regex) => regex.test(pathname))) {
    return { kind: 'channel', playlistId }
  }

  if (
    (watchRegex.test(pathname) && getQueryParam(searchParams, 'v') !== undefined) ||
    (isHostOf(parsedUrl, shortLinkHosts) && pathname.length > 1) ||
    liveRegex.test(pathname)
  ) {
    return { kind: 'watch', playlistId }
  }

  if (shortsRegex.test(pathname)) {
    return { kind: 'short', playlistId }
  }

  if (getQueryParam(searchParams, 'v') !== undefined) {
    return { kind: 'player', playlistId }
  }

  if (playlistId) {
    return { kind: 'playlist', playlistId }
  }
}

export const getYoutubePage = (
  url: string,
  content: string | undefined,
): YoutubePage | undefined => {
  const parsed = parseYoutubeUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'playlist' || parsed.playlistId) {
    return parsed
  }

  if (parsed.kind === 'channel' && parsed.channelId) {
    return parsed
  }

  // Handle, legacy user, custom URL and video pages carry the channel ID only in their content.
  const channelId = content ? extractChannelIdFromContent(content) : undefined

  return { ...parsed, channelId }
}

export const youtubeHandler: PlatformHandler = {
  match: (url) => {
    return parseYoutubeUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getYoutubePage(url, content)

    if (!page) {
      return []
    }

    const channelId = page.kind === 'playlist' ? undefined : page.channelId

    return [
      ...(channelId ? getChannelUris(channelId) : []),
      ...(page.playlistId
        ? [
            {
              uri: feeds.getFeedUrl('youtube:playlist', { playlistId: page.playlistId }),
              hint: composeHint(getPlaylistKey(page.playlistId)),
            },
          ]
        : []),
    ]
  },

  getFeedHint: (url) => {
    const parsedUrl = parseUrl(url)
    const hint = feeds.getFeedHint(url)

    if (!parsedUrl || !hint) {
      return
    }

    const channelId = getQueryParam(parsedUrl, 'channel_id')

    if (channelId) {
      if (channelIdFormatRegex.test(channelId)) {
        return composeHint('youtube:all')
      }

      return
    }

    const playlistId = getQueryParam(parsedUrl, 'playlist_id')

    // The legacy user feed names neither a channel ID nor a playlist.
    if (!playlistId) {
      return hint
    }

    return composeHint(getPlaylistKey(playlistId))
  },
}
