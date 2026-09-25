import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { FetchFnResponse } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  excludedPaths,
  hosts,
  isGitlabHeaders,
  isGitlabHtml,
} from '../../feeds/platforms/gitlab.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'gitlab'

// Extracts the username from the path. GitLab usernames can contain dots,
// so the regex strips the .atom feed extension instead of excluding dots.
const userRegex = /^\/([^/]+?)(?:\.atom)?(?:\/|$)/

const getAvatarUrl = (response: FetchFnResponse): string | undefined => {
  const data = parseResponseJson(response)

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
    const username = new URL(url).pathname.match(userRegex)?.[1]

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

  const { origin } = new URL(ref.url)

  const encodedName = encodeURIComponent(ref.id)
  const userResponse = await context.fetchFn(`${origin}/api/v4/users?username=${encodedName}`)
  const userAvatarUrl = getAvatarUrl(userResponse)

  if (userAvatarUrl) {
    return [userAvatarUrl]
  }

  const groupResponse = await context.fetchFn(`${origin}/api/v4/groups/${encodedName}`)

  // The groups API answers 404 for a private group or a name that is no group, as the users API
  // answers an empty list for a name that is no user: nothing public to show.
  if (groupResponse.status === 404) {
    return []
  }

  const groupAvatarUrl = getAvatarUrl(groupResponse)

  if (groupAvatarUrl) {
    return [groupAvatarUrl]
  }

  return []
}
