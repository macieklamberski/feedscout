import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/devto.js'
import { isNonEmptyString, parseBodyJson } from '../../utils.js'

// Extracts the username from the path, excluding dots to avoid capturing
// feed extensions that may be appended to the URL.
const userRegex = /^\/([^/.]+)/

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { pathname } = new URL(url)
      const match = pathname.match(userRegex)

      if (!isHostOf(url, hosts) || !match?.[1]) {
        return false
      }

      // Tag pages do not correspond to a user profile.
      if (match[1] === 't') {
        return false
      }

      return !isAnyOf(match[1], excludedPaths)
    } catch {}

    return false
  },

  resolve: async (url, _content, _headers, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const { pathname } = new URL(url)
      const match = pathname.match(userRegex)

      if (!match?.[1] || match[1] === 't') {
        return []
      }

      const username = match[1]
      const apiUrl = `https://dev.to/api/users/by_username?url=${encodeURIComponent(username)}`
      const response = await fetchFn(apiUrl)
      const data = parseBodyJson(response.body)
      const profileImage = data?.profile_image

      if (isNonEmptyString(profileImage)) {
        return [{ uri: profileImage }]
      }
    } catch {}

    return []
  },
}
