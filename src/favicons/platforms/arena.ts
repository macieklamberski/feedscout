import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { excludedPaths, hosts } from '../../feeds/platforms/arena.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'arena'

// Accounts without an avatar get the site-wide og-image.png on the profile page
// and an empty `display` in the API, neither of which is on this host.
const largeAvatarRegex = /^https:\/\/static\.avatars\.are\.na\/\d+\/large_/
const mediumAvatarRegex = /^(https:\/\/static\.avatars\.are\.na\/\d+\/)medium_/

const getPathSegments = (url: string): Array<string> | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  const segments = parsedUrl.pathname.split('/').filter(Boolean)

  if (segments.length === 0 || segments.length > 2) {
    return
  }

  if (segments[0] === 'editorial' || isAnyOf(segments[0], excludedPaths)) {
    return
  }

  return segments
}

export const arenaHandler: PlatformHandler = {
  match: (url) => {
    return !!getPathSegments(url)
  },

  resolve: (url, content) => {
    const segments = getPathSegments(url)

    if (!segments) {
      return []
    }

    const [username, channel] = segments

    // The og:image of a channel page is one of its blocks, not the owner's avatar.
    if (channel) {
      return [{ platform, id: `${username}/${channel}`, url }]
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
  if (data?.user?.slug !== username || typeof display !== 'string') {
    return []
  }

  if (!mediumAvatarRegex.test(display)) {
    return []
  }

  return [display.replace(mediumAvatarRegex, '$1large_')]
}
