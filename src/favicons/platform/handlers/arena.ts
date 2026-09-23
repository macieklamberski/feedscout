import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/arena.js'

// Accounts without an avatar get the site-wide og-image.png, which is not on this host.
const largeAvatarRegex = /^https:\/\/static\.avatars\.are\.na\/\d+\/large_/

const isProfileUrl = (url: string): boolean => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return false
  }

  const segments = parsedUrl.pathname.split('/').filter(Boolean)

  if (segments.length !== 1) {
    return false
  }

  return segments[0] !== 'editorial' && !isAnyOf(segments[0], excludedPaths)
}

export const arenaHandler: PlatformHandler = {
  match: (url) => {
    return isProfileUrl(url)
  },

  resolve: (url, content) => {
    if (!content || !isProfileUrl(url)) {
      return []
    }

    const image = getMetaContent(content, 'og:image')

    if (!image || !largeAvatarRegex.test(image)) {
      return []
    }

    return [{ uri: image }]
  },
}
