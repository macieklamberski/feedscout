import { isAnyOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { excludedPaths, isPixelfedHtml, profileRegex } from '../../feeds/platforms/pixelfed.js'
import type { FaviconEnricher } from '../types.js'
import { parseBodyJson } from '../utils.js'

const platform = 'pixelfed'

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

  resolve: (url, content) => {
    const username = getUsername(url)

    if (!username) {
      return []
    }

    const ogImage = getMetaContent(content ?? '', 'og:image')

    if (isAvatar(ogImage)) {
      return [{ uri: ogImage }]
    }

    return [{ platform, id: username, url }]
  },
}

export const pixelfedEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const { origin } = new URL(ref.url)
    const response = await context.fetchFn(`${origin}/api/v1/accounts/lookup?acct=${ref.id}`)
    const data = parseBodyJson(response.body)

    if (isAvatar(data.avatar)) {
      return [data.avatar]
    }
  } catch {}

  return []
}
