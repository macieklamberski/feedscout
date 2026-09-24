import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { excludedPaths, hosts } from '../../feeds/platforms/devto.js'
import type { FaviconEnricher } from '../types.js'
import { parseBodyJson } from '../utils.js'

const platform = 'devto'

// Extracts the username from the path, excluding dots to avoid capturing
// feed extensions that may be appended to the URL.
const userRegex = /^\/([^/.]+)/

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl
    const match = pathname.match(userRegex)

    if (!isHostOf(url, hosts) || !match?.[1]) {
      return false
    }

    // Tag pages do not correspond to a user profile.
    if (match[1] === 't') {
      return false
    }

    return !isAnyOf(match[1], excludedPaths)
  },

  resolve: (url) => {
    const username = parseUrl(url)?.pathname.match(userRegex)?.[1]

    if (!username || username === 't') {
      return []
    }

    return [{ platform, id: username, url }]
  },
}

export const devtoEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const apiUrl = `https://dev.to/api/users/by_username?url=${encodeURIComponent(ref.id)}`
    const response = await context.fetchFn(apiUrl)
    const data = parseBodyJson(response.body)
    const profileImage = data?.profile_image

    if (isNonEmptyString(profileImage)) {
      return [profileImage]
    }
  } catch {}

  return []
}
