import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/devto.js'
import { isNonEmptyString, parseBodyJson } from '../../utils.js'

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)

      if (!isHostOf(url, hosts) || segments.length === 0) {
        return false
      }

      const first = segments[0]

      // Tag pages do not correspond to a user profile.
      if (first === 't') {
        return false
      }

      return !isAnyOf(first, excludedPaths)
    } catch {}

    return false
  },

  resolve: async (url, _content, _headers, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const { pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)

      if (segments.length === 0 || segments[0] === 't') {
        return []
      }

      const username = segments[0]
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
