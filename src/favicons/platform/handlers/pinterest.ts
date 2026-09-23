import { getPathSegments, isAnyOf, isHostOf, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/pinterest.js'

// pin.it serves short links to pins, not profiles.
const profileHosts = hosts.filter((host) => host !== 'pin.it')
const initialPropsRegex = /<script[^>]*id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/
// A user without an avatar gets the generic s.pinimg.com/images/user/default_280.png.
const defaultAvatarRegex = /\/images\/user\/default_/

const getUsername = (url: string): string | undefined => {
  const [username, ...rest] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths) || rest.length > 0) {
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

  resolve: (url, content) => {
    const username = getUsername(url)

    if (!username || !content) {
      return []
    }

    const image = findProfileImage(content, username)

    if (!image) {
      return []
    }

    return [{ uri: image }]
  },
}
