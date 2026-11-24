import { composeQuery, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent, hasAnyMeta, hasMarker } from '../../common/utils.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'pixelfed'

export type PixelfedUrl = { kind: 'user'; username: string }

const profileRegex = /^\/(?:users\/)?([^/]+)\/?$/i

const metaMarkers: Array<[string, string]> = [
  ['generator', 'pixelfed'],
  ['application-name', 'Pixelfed'],
]

export const isPixelfedHtml = (content: string): boolean => {
  return hasAnyMeta(content, metaMarkers)
}

export const parsePixelfedUrl = (url: string): PixelfedUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const username = parsedUrl.pathname.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'user', username }
}

// An account without an uploaded avatar carries /storage/avatars/default.jpg or default.png.
const defaultAvatarRegex = /\/avatars\/default\.[a-z]+(?:\?|$)/i

const isAvatar = (value: unknown): value is string => {
  return isNonEmptyString(value) && !defaultAvatarRegex.test(value)
}

export const pixelfedHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPixelfedHtml })) {
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
  const response = await context.fetchFn(
    `${origin}/api/v1/accounts/lookup${composeQuery({ acct: ref.id })}`,
  )
  const data = parseResponseJson(response)

  if (isAvatar(data.avatar)) {
    return [data.avatar]
  }

  return []
}
