import {
  endsWithAnyOf,
  isAnyOf,
  isHostOf,
  isNonEmptyString,
  parseUrl,
  startsWithAnyOf,
} from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'
import { parseVelogUrl } from '../../feeds/platforms/velog.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'velog'

const imageHosts = ['images.velog.io', 'velog.velcdn.com']

const getSquareAvatar = (value: unknown): string | undefined => {
  // Velog shows this image for every user who has not uploaded an avatar.
  if (
    !isNonEmptyString(value) ||
    endsWithAnyOf(value, '/images/user-thumbnail.png') ||
    !isHostOf(value, imageHosts)
  ) {
    return
  }

  const parsedUrl = parseUrl(value)

  if (!parsedUrl || !startsWithAnyOf(parsedUrl.pathname, '/images/')) {
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
      isAnyOf(element.attribs.alt, 'profile') &&
      Boolean(element.attribs.src)
    )
  })

  return image?.attribs.src
}

export const velogHandler: PlatformHandler = {
  match: (url) => {
    return parseVelogUrl(url)?.kind === 'user'
  },

  resolve: (url, content) => {
    const parsed = parseVelogUrl(url)

    if (parsed?.kind !== 'user') {
      return []
    }

    const { username } = parsed

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
