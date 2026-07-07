import { isAnyOf, isHostOf, isNonEmptyString } from 'trousse'
import type { DiscoverFetchFn } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import {
  excludedPaths,
  hosts,
  isGitlabHeaders,
  isGitlabHtml,
} from '../../../feeds/platform/handlers/gitlab.js'
import { parseBodyJson } from '../../utils.js'

// Extracts the username from the path. GitLab usernames can contain dots,
// so the regex strips the .atom feed extension instead of excluding dots.
const userRegex = /^\/([^/]+?)(?:\.atom)?(?:\/|$)/

const fetchAvatarUrl = async (
  apiUrl: string,
  fetchFn: DiscoverFetchFn,
): Promise<string | undefined> => {
  const response = await fetchFn(apiUrl)
  const data = parseBodyJson(response.body)

  // Users API returns an array, groups API returns an object.
  const entry = Array.isArray(data) ? data[0] : data

  if (isNonEmptyString(entry?.avatar_url)) {
    return entry.avatar_url
  }
}

export const gitlabHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      if (isHostOf(url, hosts)) {
        return true
      }

      const { pathname } = new URL(url)

      if (!userRegex.test(pathname)) {
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
      const match = pathname.match(userRegex)

      if (!match?.[1]) {
        return []
      }

      const username = match[1]

      if (isAnyOf(username, excludedPaths)) {
        return []
      }

      // Try users API first, then fall back to groups API.
      const encodedName = encodeURIComponent(username)
      const avatarUrl =
        (await fetchAvatarUrl(`${origin}/api/v4/users?username=${encodedName}`, fetchFn)) ??
        (await fetchAvatarUrl(`${origin}/api/v4/groups/${encodedName}`, fetchFn))

      if (avatarUrl) {
        return [{ uri: avatarUrl }]
      }
    } catch {}

    return []
  },
}
