import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { collectionRegex, hosts } from '../../../feeds/platform/handlers/observable.js'
import { parseBodyJson } from '../../utils.js'

const profileRegex = /^\/@([^/]+)\/?$/

const getLogin = (pathname: string): string | undefined => {
  return pathname.match(profileRegex)?.[1] ?? pathname.match(collectionRegex)?.[1]
}

// Observable pages answer 429 from a bot checkpoint, so the login comes from the URL.
export const observableHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return isHostOf(url, hosts) && !!getLogin(parsedUrl.pathname)
  },

  resolve: async (url, _content, _headers, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const login = getLogin(new URL(url).pathname)

      if (!login) {
        return []
      }

      const response = await fetchFn(`https://api.observablehq.com/user/@${login}`)
      const data = parseBodyJson(response.body)
      const avatarUrl = data?.avatar_url

      if (isNonEmptyString(avatarUrl)) {
        return [{ uri: avatarUrl }]
      }
    } catch {}

    return []
  },
}
