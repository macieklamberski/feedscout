import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { isPixelfedHtml, parsePixelfedUrl } from '../../feeds/platforms/pixelfed.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

// An account without an uploaded avatar carries /storage/avatars/default.jpg or default.png.
const defaultAvatarRegex = /\/avatars\/default\.[a-z]+(?:\?|$)/

const platform = 'pixelfed'

const isAvatar = (value: unknown): value is string => {
  return isNonEmptyString(value) && !defaultAvatarRegex.test(value)
}

export const pixelfedHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isPixelfedHtml(content)) {
      return false
    }

    return parsePixelfedUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const username = parsePixelfedUrl(url)?.username

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

  const { origin } = new URL(ref.url)
  const response = await context.fetchFn(`${origin}/api/v1/accounts/lookup?acct=${ref.id}`)
  const data = parseResponseJson(response)

  if (isAvatar(data.avatar)) {
    return [data.avatar]
  }

  return []
}
