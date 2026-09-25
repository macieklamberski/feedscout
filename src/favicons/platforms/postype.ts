import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { hosts } from '../../feeds/platforms/postype.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'postype'

// A channel without an avatar carries a placeholder from d33pksfia2a94m.cloudfront.net.
const avatarHost = 'd3mcojo3jv0dbr.cloudfront.net'

// The CDN center-crops to a square only when both sides fit inside the raw file, which is
// often under 400 pixels on a side. Postype's own channel thumbnail asks for 200.
const avatarQuery = '?w=200&h=200'

const getChannel = (url: string): string | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [first] = getPathSegments(url)

  if (!first?.startsWith('@') || first.length < 2) {
    return
  }

  return first.slice(1)
}

const parseAvatar = (html: string): string | undefined => {
  const image = getMetaContent(html, 'og:image')

  if (!image) {
    return
  }

  const parsedUrl = parseUrl(image)

  if (!parsedUrl || parsedUrl.hostname !== avatarHost) {
    return
  }

  return `${parsedUrl.origin}${parsedUrl.pathname}${avatarQuery}`
}

export const postypeHandler: PlatformHandler = {
  match: (url) => {
    return Boolean(getChannel(url))
  },

  resolve: (url, content) => {
    const channel = getChannel(url)

    if (!channel) {
      return []
    }

    // A post page carries the post cover as its og:image.
    if (content && getPathSegments(url).length === 1) {
      const avatar = parseAvatar(content)

      if (avatar) {
        return [{ uri: avatar }]
      }
    }

    return [{ platform, id: channel, url }]
  },
}

export const postypeEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://www.postype.com/@${ref.id}`)
  const avatar = parseAvatar(getResponseText(response))

  if (avatar) {
    return [avatar]
  }

  return []
}
