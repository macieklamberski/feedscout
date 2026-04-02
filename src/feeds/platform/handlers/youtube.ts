import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const channelIdPattern = /"(?:channelId|externalId)":"(UC[a-zA-Z0-9_-]+)"/
const channelPattern = /^\/channel\/(UC[a-zA-Z0-9_-]+)/
const handlePattern = /^\/@([^/]+)/
const userPattern = /^\/user\/([^/]+)/
const customPattern = /^\/c\/([^/]+)/
const channelPrefixPattern = /^UC/

const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']

const extractChannelIdFromContent = (content: string): string | undefined => {
  const match = content.match(channelIdPattern)

  return match?.[1]
}

// Convert channel ID to playlist IDs for filtered feeds.
// YouTube playlist prefixes: UU = all (legacy), UULF = videos only, UUSH = shorts only, UULV = live streams only.
const getAllUploadsPlaylistId = (channelId: string): string => {
  return channelId.replace(channelPrefixPattern, 'UU')
}

const getVideosOnlyPlaylistId = (channelId: string): string => {
  return channelId.replace(channelPrefixPattern, 'UULF')
}

const getShortsOnlyPlaylistId = (channelId: string): string => {
  return channelId.replace(channelPrefixPattern, 'UUSH')
}

const getLiveStreamsOnlyPlaylistId = (channelId: string): string => {
  return channelId.replace(channelPrefixPattern, 'UULV')
}

const feedUrl = (param: string, value: string): string => {
  return `https://www.youtube.com/feeds/videos.xml?${param}=${value}`
}

const pushChannelUris = (uris: Array<DiscoverUriEntry>, channelId: string): void => {
  uris.push({
    uri: [
      feedUrl('channel_id', channelId),
      feedUrl('playlist_id', getAllUploadsPlaylistId(channelId)),
    ],
    hint: composeHint('youtube:all'),
  })
  uris.push({
    uri: feedUrl('playlist_id', getVideosOnlyPlaylistId(channelId)),
    hint: composeHint('youtube:videos'),
  })
  uris.push({
    uri: feedUrl('playlist_id', getShortsOnlyPlaylistId(channelId)),
    hint: composeHint('youtube:shorts'),
  })
  uris.push({
    uri: feedUrl('playlist_id', getLiveStreamsOnlyPlaylistId(channelId)),
    hint: composeHint('youtube:live'),
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
    const channelMatch = parsedUrl.pathname.match(channelPattern)

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
    if (uris.length === 0 && content) {
      const isVideoPage =
        parsedUrl.searchParams.has('v') ||
        (parsedUrl.hostname.includes('youtu.be') && parsedUrl.pathname.length > 1)
      const needsContentParsing =
        isVideoPage ||
        parsedUrl.pathname.match(handlePattern) ||
        parsedUrl.pathname.match(userPattern) ||
        parsedUrl.pathname.match(customPattern)

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
