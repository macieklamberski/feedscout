import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { FetchFn } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  excludedPaths,
  hosts,
  isGitlabHeaders,
  isGitlabHtml,
} from '../../feeds/platforms/gitlab.js'
import type { FaviconEnricher } from '../types.js'
import { parseBodyJson } from '../utils.js'

const platform = 'gitlab'

// Extracts the username from the path. GitLab usernames can contain dots,
// so the regex strips the .atom feed extension instead of excluding dots.
const userRegex = /^\/([^/]+?)(?:\.atom)?(?:\/|$)/

const fetchAvatarUrl = async (apiUrl: string, fetchFn: FetchFn): Promise<string | undefined> => {
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
    if (isHostOf(url, hosts)) {
      return true
    }

    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl

    if (!userRegex.test(pathname)) {
      return false
    }

    if (content && isGitlabHtml(content)) {
      return true
    }

    if (headers && isGitlabHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    const username = parseUrl(url)?.pathname.match(userRegex)?.[1]

    if (!username || isAnyOf(username, excludedPaths)) {
      return []
    }

    return [{ platform, id: username, url }]
  },
}

export const gitlabEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const { origin } = new URL(ref.url)

    // Try users API first, then fall back to groups API.
    const encodedName = encodeURIComponent(ref.id)
    const avatarUrl =
      (await fetchAvatarUrl(`${origin}/api/v4/users?username=${encodedName}`, context.fetchFn)) ??
      (await fetchAvatarUrl(`${origin}/api/v4/groups/${encodedName}`, context.fetchFn))

    if (avatarUrl) {
      return [avatarUrl]
    }
  } catch {}

  return []
}
