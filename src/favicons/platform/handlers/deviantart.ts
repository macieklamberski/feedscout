import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/deviantart.js'

export const deviantartHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)

      if (!isHostOf(url, hosts) || segments.length === 0) {
        return false
      }

      if (segments[0] === 'tag') {
        return false
      }

      return !isAnyOf(segments[0], excludedPaths)
    } catch {}

    return false
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0 || segments[0] === 'tag') {
      return []
    }

    const username = segments[0].toLowerCase()

    if (isAnyOf(username, excludedPaths) || username.length < 2) {
      return []
    }

    const uri: Array<string> = [
      `https://a.deviantart.net/avatars-big/${username[0]}/${username[1]}/${username}.jpg`,
      `https://a.deviantart.net/avatars-big/${username[0]}/${username[1]}/${username}.gif`,
      `https://a.deviantart.net/avatars-big/${username[0]}/${username[1]}/${username}.png`,
    ]

    return uri.map((value) => ({ uri: value }))
  },
}
