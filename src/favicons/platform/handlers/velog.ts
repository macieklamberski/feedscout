import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { hosts, userRegex } from '../../../feeds/platform/handlers/velog.js'
import { parseBodyJson } from '../../utils.js'

const profileImageRegex = /<img(?=[^>]*\balt=["']profile["'])[^>]*\bsrc=["']([^"']+)["']/i

// Velog shows this image for every user who has not uploaded an avatar.
const placeholderRegex = /\/images\/user-thumbnail\.png$/

const isAvatar = (value: unknown): value is string => {
  return isNonEmptyString(value) && !placeholderRegex.test(value)
}

export const velogHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return isHostOf(url, hosts) && userRegex.test(parsedUrl.pathname)
  },

  resolve: async (url, content, _headers, fetchFn) => {
    try {
      const { pathname } = new URL(url)
      const match = pathname.match(userRegex)

      if (!match?.[1]) {
        return []
      }

      const pageImage = content?.match(profileImageRegex)?.[1]

      if (isAvatar(pageImage)) {
        return [{ uri: pageImage }]
      }

      if (!fetchFn) {
        return []
      }

      const username = decodeURIComponent(match[1])
      const query = new URLSearchParams({
        query: `{user(username:${JSON.stringify(username)}){profile{thumbnail}}}`,
      })
      const response = await fetchFn(`https://v2.velog.io/graphql?${query}`)
      const data = parseBodyJson(response.body)
      const thumbnail = data?.data?.user?.profile?.thumbnail

      if (isAvatar(thumbnail)) {
        return [{ uri: thumbnail }]
      }
    } catch {}

    return []
  },
}
