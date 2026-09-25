import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'
import { parseVelogUrl } from '../../feeds/platforms/velog.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'velog'

const imageHosts = ['images.velog.io', 'velog.velcdn.com']

// Velog shows this image for every user who has not uploaded an avatar.
const placeholderRegex = /\/images\/user-thumbnail\.png$/

const getSquareAvatar = (value: unknown): string | undefined => {
  if (!isNonEmptyString(value) || placeholderRegex.test(value) || !isHostOf(value, imageHosts)) {
    return
  }

  const parsedUrl = parseUrl(value)

  if (!parsedUrl?.pathname.startsWith('/images/')) {
    return
  }

  // Velog serves the raw upload, which is not always square. The prefix is a Cloudflare crop on
  // velog's image host that velog's own client does not use.
  return `https://velog.velcdn.com/cdn-cgi/image/width=256,height=256,fit=cover${parsedUrl.pathname}`
}

const findProfileImageSrc = (content: string | undefined): string | undefined => {
  const image = findElement(content, (element) => {
    return (
      element.name === 'img' &&
      isAnyOf(element.attribs.alt ?? '', ['profile']) &&
      Boolean(element.attribs.src)
    )
  })

  return image?.attribs.src
}

export const velogHandler: PlatformHandler = {
  match: (url) => {
    return parseVelogUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const username = parseVelogUrl(url)?.username

    if (!username) {
      return []
    }

    const avatar = getSquareAvatar(findProfileImageSrc(content))

    if (!avatar) {
      return [{ platform, id: username, url }]
    }

    return [{ uri: avatar }]
  },
}

export const velogEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const query = new URLSearchParams({
    query: `{user(username:${JSON.stringify(ref.id)}){profile{thumbnail}}}`,
  })
  const response = await context.fetchFn(`https://v2.velog.io/graphql?${query}`)
  const data = parseResponseJson(response)
  const avatar = getSquareAvatar(data?.data?.user?.profile?.thumbnail)

  if (avatar) {
    return [avatar]
  }

  return []
}
