import { getPathSegments, isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getScriptText } from '../../common/utils.js'
import { parsePinterestUrl } from '../../feeds/platforms/pinterest.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

// A user without an avatar gets the generic s.pinimg.com/images/user/default_280.png.
const defaultAvatarRegex = /\/images\/user\/default_/

const platform = 'pinterest'

const findProfileImage = (content: string, username: string): string | undefined => {
  const json = getScriptText(content, '__PWS_INITIAL_PROPS__')

  if (!json) {
    return
  }

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
}

export const pinterestHandler: PlatformHandler = {
  match: (url) => {
    return parsePinterestUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const username = parsePinterestUrl(url)?.username

    if (!username) {
      return []
    }

    // Only the profile page carries the user in its initial Redux state.
    if (getPathSegments(url).length > 1 || !content) {
      return [{ platform, id: username, url }]
    }

    const image = findProfileImage(content, username)

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

  const response = await context.fetchFn(`https://www.pinterest.com/${ref.id}/`)
  const body = getResponseText(response)
  const image = findProfileImage(body, ref.id)

  if (image) {
    return [image]
  }

  return []
}
