import { getPathSegments, isAnyOf, isHostOf, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/pinterest.js'
import type { FaviconEnricher } from '../../types.js'

const platform = 'pinterest'

// pin.it serves short links to pins, not profiles.
const profileHosts = hosts.filter((host) => host !== 'pin.it')
const initialPropsRegex = /<script[^>]*id="__PWS_INITIAL_PROPS__"[^>]*>([\s\S]*?)<\/script>/
// A user without an avatar gets the generic s.pinimg.com/images/user/default_280.png.
const defaultAvatarRegex = /\/images\/user\/default_/

const getProfile = (url: string): { username: string; isSaved: boolean } | undefined => {
  const [username, subpage, ...rest] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths) || rest.length > 0) {
    return
  }

  if (subpage && subpage !== '_saved') {
    return
  }

  return { username, isSaved: subpage === '_saved' }
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
    return isHostOf(url, profileHosts) && !!getProfile(url)
  },

  resolve: (url, content) => {
    const profile = getProfile(url)

    if (!profile) {
      return []
    }

    // The _saved page carries no user in its initial Redux state, only the profile page does.
    if (profile.isSaved || !content) {
      return [{ platform, id: profile.username, url }]
    }

    const image = findProfileImage(content, profile.username)

    if (!image) {
      return []
    }

    return [{ uri: image }]
  },
}

export const pinterestEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const response = await context.fetchFn(`https://www.pinterest.com/${ref.id}/`)
    const body = typeof response.body === 'string' ? response.body : ''
    const image = findProfileImage(body, ref.id)

    if (image) {
      return [image]
    }
  } catch {}

  return []
}
