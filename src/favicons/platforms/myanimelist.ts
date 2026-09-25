import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hosts, userRegex } from '../../feeds/platforms/myanimelist.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'myanimelist'

const avatarRegex = /<div class="user-image[\s"][^>]*>\s*<img[^>]*\sdata-src="([^"]+)"/i
const userImageRegex = /^https:\/\/cdn\.myanimelist\.net\/s\/common\/userimages\//

const getUser = (url: string): string | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  return parseUrl(url)?.pathname.match(userRegex)?.[1]
}

// A user without an avatar gets a "No Picture" block and no image.
const parseAvatar = (html: string): Array<string> => {
  const src = html.match(avatarRegex)?.[1]

  if (!src || !userImageRegex.test(src)) {
    return []
  }

  return [src]
}

export const myanimelistHandler: PlatformHandler = {
  match: (url) => {
    return !!getUser(url)
  },

  resolve: (url, content) => {
    const user = getUser(url)

    if (!user) {
      return []
    }

    const [section, ...rest] = getPathSegments(url)

    // List and history pages carry no avatar, while the user's profile page does.
    if (!content || section !== 'profile' || rest.length !== 1) {
      return [{ platform, id: user, url }]
    }

    return parseAvatar(content).map((uri) => ({ uri }))
  },
}

export const myanimelistEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://myanimelist.net/profile/${ref.id}`)

  return parseAvatar(getResponseText(response))
}
