import { isAnyOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import {
  excludedPaths,
  isPixelfedHtml,
  profileRegex,
} from '../../../feeds/platform/handlers/pixelfed.js'
import { parseBodyJson } from '../../utils.js'

// An account without an uploaded avatar carries /storage/avatars/default.jpg or default.png.
const defaultAvatarRegex = /\/avatars\/default\.[a-z]+(?:\?|$)/

const getUsername = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const match = parsedUrl.pathname.match(profileRegex)

  if (!match?.[1] || isAnyOf(match[1], excludedPaths)) {
    return
  }

  return match[1]
}

const isAvatar = (value: unknown): value is string => {
  return isNonEmptyString(value) && !defaultAvatarRegex.test(value)
}

export const pixelfedHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isPixelfedHtml(content)) {
      return false
    }

    return Boolean(getUsername(url))
  },

  resolve: async (url, content, _headers, fetchFn) => {
    const username = getUsername(url)

    if (!username) {
      return []
    }

    const ogImage = getMetaContent(content ?? '', 'og:image')

    if (isAvatar(ogImage)) {
      return [{ uri: ogImage }]
    }

    if (!fetchFn) {
      return []
    }

    try {
      const { origin } = new URL(url)
      const response = await fetchFn(`${origin}/api/v1/accounts/lookup?acct=${username}`)
      const data = parseBodyJson(response.body)

      if (isAvatar(data?.avatar)) {
        return [{ uri: data.avatar }]
      }
    } catch {}

    return []
  },
}
