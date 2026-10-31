import { isNonEmptyString, isSameText } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getScriptText } from '../../common/utils.js'
import { parsePinterestUrl } from '../../feeds/platforms/pinterest.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'pinterest'

// A user without an avatar gets the generic s.pinimg.com/images/user/default_280.png.
const defaultAvatarRegex = /\/images\/user\/default_/

const findProfileImage = (content: string, username: string): string | undefined => {
  const json = getScriptText(content, '__PWS_INITIAL_PROPS__')

  if (!json) {
    return
  }

  let users: Record<string, { username?: string; image_xlarge_url?: string }> = {}

  try {
    users = JSON.parse(json)?.initialReduxState?.users ?? {}
  } catch {
    return
  }

  for (const user of Object.values(users)) {
    if (!isSameText(user?.username, username)) {
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
    const parsed = parsePinterestUrl(url)

    if (!parsed) {
      return []
    }

    // Only the profile page carries the user in its initial Redux state.
    if (parsed.kind !== 'user' || !content) {
      return [{ platform, id: parsed.username, url }]
    }

    const image = findProfileImage(content, parsed.username)

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
