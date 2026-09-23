import { getPathSegments, isAnyOf, isHostOf, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/pinterest.js'

// pin.it serves short links to pins, not profiles.
const profileHosts = hosts.filter((host) => host !== 'pin.it')
const initialPropsRegex = /<script[^>]*id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/
// A user without an avatar gets the generic s.pinimg.com/images/user/default_280.png.
const defaultAvatarRegex = /\/images\/user\/default_/

const getUsername = (url: string): string | undefined => {
  const [username, subpage, ...rest] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths) || rest.length > 0) {
    return
  }

  if (subpage && subpage !== '_saved') {
    return
  }

  return username
}

const findProfileImage = (content: string, username: string): string | undefined => {
  const json = content.match(initialPropsRegex)?.[1]

  if (!json) {
    return
  }

  try {
    const users = JSON.parse(json)?.initialReduxState?.users ?? {}

    for (const user of Object.values<{ username?: string; image_xlarge_url?: string }>(users)) {
      if (user?.username?.toLowerCase() !== username.toLowerCase()) {
        continue
      }

      const image = user.image_xlarge_url

      if (isNonEmptyString(image) && !defaultAvatarRegex.test(image)) {
        return image
      }
    }
  } catch {}
}

export const pinterestHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, profileHosts) && !!getUsername(url)
  },

  resolve: async (url, content, _headers, fetchFn) => {
    const username = getUsername(url)

    if (!username) {
      return []
    }

    const contentImage = findProfileImage(content ?? '', username)

    if (contentImage) {
      return [{ uri: contentImage }]
    }

    if (!fetchFn) {
      return []
    }

    // The _saved page carries no user in its initial Redux state, only the profile page does.
    try {
      const response = await fetchFn(`https://www.pinterest.com/${username}/`)
      const body = typeof response.body === 'string' ? response.body : ''
      const fetchedImage = findProfileImage(body, username)

      if (fetchedImage) {
        return [{ uri: fetchedImage }]
      }
    } catch {}

    return []
  },
}
