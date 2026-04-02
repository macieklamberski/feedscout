import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'
import {
  excludedPaths,
  hosts,
  isGitlabHeaders,
  isGitlabHtml,
} from '../../../feeds/platform/handlers/gitlab.js'
import { isNonEmptyString, parseBodyJson } from '../../utils.js'

// Extracts the username from the path. GitLab usernames can contain dots,
// so the regex strips the .atom feed extension instead of excluding dots.
const userPattern = /^\/([^/]+?)(?:\.atom)?(?:\/|$)/

export const gitlabHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      if (isHostOf(url, hosts)) {
        return true
      }

      const { pathname } = new URL(url)

      if (!userPattern.test(pathname)) {
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
      const match = pathname.match(userPattern)

      if (!match?.[1]) {
        return []
      }

      const username = match[1]

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
