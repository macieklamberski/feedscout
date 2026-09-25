import { getPathSegments, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import {
  parsePostypeUrl,
  postypeHandler as postypeFeedHandler,
} from '../../feeds/platforms/postype.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'postype'

// A channel without an avatar carries a placeholder from d33pksfia2a94m.cloudfront.net.
const avatarHost = 'd3mcojo3jv0dbr.cloudfront.net'

// The CDN center-crops to a square only when both sides fit inside the raw file, which is
// often under 400 pixels on a side. Postype's own channel thumbnail asks for 200.
const avatarQuery = '?w=200&h=200'

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
  match: postypeFeedHandler.match,

  resolve: (url, content) => {
    const parsed = parsePostypeUrl(url)

    if (!parsed) {
      return []
    }

    // A post page carries the post cover as its og:image.
    if (content && parsed.kind === 'channel' && getPathSegments(url).length === 1) {
      const avatar = parseAvatar(content)

      if (avatar) {
        return [{ uri: avatar }]
      }
    }

    return [{ platform, id: parsed.channel, url }]
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
