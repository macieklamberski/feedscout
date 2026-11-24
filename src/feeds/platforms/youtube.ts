import { isYoutubeFeedPlaylistId, youtube } from 'feedintel'
import { getQueryParam, isAnyOf, isPresent, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: all, live, member-live, member-videos, playlist, popular-live, popular-shorts, popular-videos, shorts, videos.

export type YoutubeUrl =
  | { kind: 'channel'; channelId?: string; playlistId?: string }
  | { kind: 'watch'; playlistId?: string }
  | { kind: 'short'; playlistId?: string }
  | { kind: 'player'; channelId?: string; username?: string; playlistId?: string }
  | { kind: 'playlist'; playlistId: string }
export type YoutubePage =
  | {
      kind: 'channel' | 'watch' | 'short' | 'player'
      channelId?: string
      username?: string
      playlistId?: string
    }
  | { kind: 'playlist'; playlistId: string }

type YoutubeFeedKey = Parameters<typeof youtube.feeds.getFeedEntry>[0]

// A channel page also embeds the IDs of the channels it features, and a bare "channelId" matches
// one of those before the page's own, which sits under "externalId". A video page has no
// "externalId", and its uploader sits under "externalChannelId" and "channelId".
const channelIdRegexes = [
  /"externalId":"(UC[a-zA-Z0-9_-]+)"/,
  /"externalChannelId":"(UC[a-zA-Z0-9_-]+)"/,
  /"channelId":"(UC[a-zA-Z0-9_-]+)"/,
]

const channelPrefixRegex = /^UC/
// A channel ID is UC and 22 characters, so the fixed length tells UULF{id} apart from UU{id}
// whose ID starts with LF.
const uploadsPlaylistRegex = /^(UU(?:LF|SH|LV|LP|PS|PV|MO|MS|MV)?)[\w-]{22}$/

// The playlists YouTube derives from a channel, the UC of its ID replaced by the prefix. The bare
// UU list is the channel's uploads, the second spelling of the channel feed.
// See: https://stackoverflow.com/a/77816885.
const uploadsPlaylistKeys: Record<string, YoutubeFeedKey> = {
  UULF: 'videos',
  UUSH: 'shorts',
  UULV: 'live',
  UULP: 'popular-videos',
  UUPS: 'popular-shorts',
  UUPV: 'popular-live',
  UUMO: 'member-videos',
  UUMS: 'member-shorts',
  UUMV: 'member-live',
}

const feeds = withHintLabels(youtube.feeds)

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
const getPlaylistKey = (playlistId: string | undefined): YoutubeFeedKey => {
  const uploadsPrefix = playlistId?.match(uploadsPlaylistRegex)?.[1]

  if (uploadsPrefix === 'UU') {
    return 'all'
  }

  if (uploadsPrefix) {
    return uploadsPlaylistKeys[uploadsPrefix]
  }

  return 'playlist'
}

const getChannelUris = (channelId: string): Array<DiscoverUriEntry | undefined> => {
  return [
    {
      uri: [
        feeds.getFeedUrl('all', { channelId }),
        feeds.getFeedUrl('all', { playlistId: toUploadsPlaylistId('UU', channelId) }),
      ].filter(isPresent),
      hint: composeHint('youtube:all'),
    },
    ...Object.entries(uploadsPlaylistKeys).map(([prefix, key]) => {
      return feeds.getFeedEntry(key, { playlistId: toUploadsPlaylistId(prefix, channelId) })
    }),
  ]
}

export const parseYoutubeUrl = (url: string): YoutubeUrl | undefined => {
  const page = youtube.pages.read(url)
  const parsedUrl = parseUrl(url)

  if (!page || !parsedUrl) {
    return
  }

  const { searchParams } = parsedUrl
  const listType = getQueryParam(searchParams, 'listType')
  const listId = getQueryParam(searchParams, 'list')
  // An embed's `listType=user_uploads` names a legacy username in `list`, and `listType=search` a
  // search query, so only a bare or `playlist` list is a playlist ID.
  const isPlaylistList = listType === undefined || isAnyOf(listType, 'playlist')
  const playlistId =
    listId && isPlaylistList && isYoutubeFeedPlaylistId(listId) ? listId : undefined
  const username = isAnyOf(listType, 'user_uploads') ? listId : undefined

  if (page.key === 'channel') {
    return { kind: 'channel', channelId: page.params.channelId, playlistId }
  }

  if (page.key === 'live-stream') {
    if (!page.params.channelId) {
      return
    }

    return { kind: 'player', channelId: page.params.channelId }
  }

  if (page.key === 'handle') {
    return { kind: 'channel', playlistId }
  }

  if (page.key === 'watch' || page.key === 'short' || page.key === 'player') {
    return { kind: page.key, playlistId }
  }

  if (playlistId) {
    return { kind: 'playlist', playlistId }
  }

  if (username) {
    return { kind: 'player', username }
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

  // An embed names its channel or legacy username in the query, and its page carries neither.
  if (parsed.kind === 'player' && (parsed.channelId || parsed.username)) {
    return parsed
  }

  // Handle, legacy user, custom URL and video pages carry the channel ID only in their content.
  const channelId = content ? extractChannelIdFromContent(content) : undefined

  return { ...parsed, channelId }
}

// An uploads list is refused by the `playlist` row, so each list builds under its own key.
const getPlaylistEntry = (playlistId: string | undefined): DiscoverUriEntry | undefined => {
  return feeds.getFeedEntry(getPlaylistKey(playlistId), { playlistId })
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

    if (page.kind === 'playlist') {
      return [getPlaylistEntry(page.playlistId)].filter(isPresent)
    }

    if (page.channelId) {
      return [
        ...getChannelUris(page.channelId),
        feeds.getFeedEntry('all', { user: page.username }),
        getPlaylistEntry(page.playlistId),
      ].filter(isPresent)
    }

    return [
      feeds.getFeedEntry('all', { user: page.username }),
      getPlaylistEntry(page.playlistId),
    ].filter(isPresent)
  },

  getFeedHint: feeds.getFeedHint,
}
