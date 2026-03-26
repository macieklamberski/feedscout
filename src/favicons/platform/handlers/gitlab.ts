import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'
import {
  excludedPaths,
  hosts,
  isGitlabHeaders,
  isGitlabHtml,
} from '../../../feeds/platform/handlers/gitlab.js'
import { isNonEmptyString, parseBodyJson } from '../../utils.js'

export const gitlabHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      if (isHostOf(url, hosts)) {
        return true
      }

      const { pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)

      if (segments.length === 0) {
        return false
      }

      if (content && isGitlabHtml(content)) {
        return true
      }

      if (headers && isGitlabHeaders(headers)) {
        return true
      }
    } catch {}

    return false
  },

  resolve: async (url, _content, _headers, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const { origin, pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)

      if (segments.length === 0) {
        return []
      }

      const username = segments[0]

      if (isAnyOf(username, excludedPaths)) {
        return []
      }

      const apiUrl = `${origin}/api/v4/users?username=${encodeURIComponent(username)}`
      const response = await fetchFn(apiUrl)
      const data = parseBodyJson(response.body)

      if (Array.isArray(data) && data.length > 0) {
        const avatarUrl = data[0]?.avatar_url

        if (isNonEmptyString(avatarUrl)) {
          return [{ uri: avatarUrl }]
        }
      }
    } catch {}

    return []
  },
}
