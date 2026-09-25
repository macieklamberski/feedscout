import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { collectionRegex, hosts } from '../../feeds/platforms/observable.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'observable'

const profileRegex = /^\/@([^/]+)\/?$/

const getLogin = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  const { pathname } = parsedUrl

  return pathname.match(profileRegex)?.[1] ?? pathname.match(collectionRegex)?.[1]
}

// Observable pages answer 429 from a bot checkpoint, so the login comes from the URL.
export const observableHandler: PlatformHandler = {
  match: (url) => {
    return getLogin(url) !== undefined
  },

  resolve: (url) => {
    const login = getLogin(url)

    if (!login) {
      return []
    }

    return [{ platform, id: login, url }]
  },
}

export const observableEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://api.observablehq.com/user/@${ref.id}`)
  const data = parseResponseJson(response)

  if (isNonEmptyString(data?.avatar_url)) {
    return [data.avatar_url]
  }

  return []
}
