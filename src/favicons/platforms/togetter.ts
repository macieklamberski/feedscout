import {
  getPathSegments,
  isAnyOf,
  isHostOf,
  isNonEmptyString,
  isPlainObject,
  parseUrl,
} from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJsonLd } from '../../common/utils.js'

export type TogetterUrl = { kind: 'user'; username: string } | { kind: 'recent' } | { kind: 'home' }

const hosts = ['togetter.com', 'www.togetter.com']

const userPathRegex = /^\/id\/([^/]+)/i

export const parseTogetterUrl = (url: string): TogetterUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userPathRegex)?.[1]

  if (username) {
    return { kind: 'user', username }
  }

  const [route] = getPathSegments(parsedUrl)

  if (isAnyOf(route, 'recent')) {
    return { kind: 'recent' }
  }

  return { kind: 'home' }
}

const twitterSizeRegex = /_normal(\.\w+)$/

// The ProfilePage avatar is the user's X avatar at 48 by 48 pixels, and X serves the same image at
// 400 by 400 when the `_normal` suffix is swapped.
const getProfileImage = (content: string): string | undefined => {
  for (const item of getJsonLd(content).flat()) {
    if (!isPlainObject(item) || item['@type'] !== 'ProfilePage') {
      continue
    }

    const entity = item.mainEntity

    if (isPlainObject(entity) && isNonEmptyString(entity.image)) {
      return entity.image.replace(twitterSizeRegex, '_400x400$1')
    }
  }
}

export const togetterHandler: PlatformHandler = {
  match: (url) => {
    return parseTogetterUrl(url)?.kind === 'user'
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const image = getProfileImage(content)

    if (!image) {
      return []
    }

    return [{ uri: image }]
  },
}
