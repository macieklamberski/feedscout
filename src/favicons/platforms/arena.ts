import { arena } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, isString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'arena'

export type ArenaUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'channel'; username: string; channel: string }
  | { kind: 'editorial' }

const hosts = arena.hosts.exact

// Views of a profile. The profile feed sits at /{username}/feed/rss, so `feed` names no channel.
const profilePaths = [
  'all',
  'blocks',
  'channels',
  'feed',
  'followers',
  'following',
  'groups',
  'index',
  'table',
]

export const parseArenaUrl = (url: string): ArenaUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, channel] = getPathSegments(url)

  // Article pages under /editorial have no feed of their own.
  if (isAnyOf(username, 'editorial')) {
    return { kind: 'editorial' }
  }

  if (!username) {
    return
  }

  if (channel && !isAnyOf(channel, profilePaths)) {
    return { kind: 'channel', username, channel }
  }

  return { kind: 'profile', username }
}

// Accounts without an avatar get the site-wide og-image.png on the profile page
// and an empty `display` in the API, neither of which is on this host.
const largeAvatarRegex = /^https:\/\/static\.avatars\.are\.na\/\d+\/large_/i
const mediumAvatarRegex = /^(https:\/\/static\.avatars\.are\.na\/\d+\/)medium_/i

export const arenaHandler: PlatformHandler = {
  match: (url) => {
    const kind = parseArenaUrl(url)?.kind

    return kind !== undefined && kind !== 'editorial'
  },

  resolve: (url, content) => {
    const parsed = parseArenaUrl(url)

    // The og:image of a channel page is one of its blocks, not the owner's avatar.
    if (parsed?.kind === 'channel') {
      return [{ platform, id: `${parsed.username}/${parsed.channel}`, url }]
    }

    if (parsed?.kind !== 'profile') {
      return []
    }

    const image = content ? getMetaContent(content, 'og:image') : undefined

    if (!image || !largeAvatarRegex.test(image)) {
      return []
    }

    return [{ uri: image }]
  },
}

export const arenaEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const [username, channel] = ref.id.split('/')

  if (!channel) {
    return []
  }

  const apiUrl = `https://api.are.na/v2/channels/${encodeURIComponent(channel)}?per=1`
  const response = await context.fetchFn(apiUrl)
  const data = parseResponseJson(response)
  const display = data?.user?.avatar_image?.display

  // The API also looks channels up by numeric id, so /block/{id} and profile
  // subpages would otherwise resolve to another user's channel.
  if (data?.user?.slug !== username || !isString(display)) {
    return []
  }

  if (!mediumAvatarRegex.test(display)) {
    return []
  }

  return [display.replace(mediumAvatarRegex, '$1large_')]
}
