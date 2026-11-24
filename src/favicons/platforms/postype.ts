import { postype } from 'feedintel'
import { getOrigin, getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent, getTenantSubdomain } from '../../common/utils.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'postype'

// A channel subdomain redirects to www.postype.com/@{channel}.
export type PostypeUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'post'; channel: string }
  | { kind: 'subdomain'; channel: string }

const domains = postype.hosts.tenants
const hosts = postype.hosts.exact

export const parsePostypeUrl = (url: string): PostypeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOf(parsedUrl, hosts)) {
    const [channelHandle, postSlug] = getPathSegments(parsedUrl)

    // length: keeps a bare @ with no channel after it out
    if (!channelHandle?.startsWith('@') || channelHandle.length < 2) {
      return
    }

    if (postSlug) {
      return { kind: 'post', channel: channelHandle.slice(1) }
    }

    return { kind: 'channel', channel: channelHandle.slice(1) }
  }

  const subdomain = getTenantSubdomain(parsedUrl, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'subdomain', channel: subdomain }
}

// A channel without an avatar carries a placeholder from d33pksfia2a94m.cloudfront.net.
const avatarHosts = ['d3mcojo3jv0dbr.cloudfront.net']

// The CDN center-crops to a square only when both sides fit inside the raw file, which is
// often under 400 pixels on a side. Postype's own channel thumbnail asks for 200.
const avatarQuery = '?w=200&h=200'

const parseAvatar = (html: string): string | undefined => {
  const image = getMetaContent(html, 'og:image')

  if (!image) {
    return
  }

  const parsedUrl = parseUrl(image)
  const origin = getOrigin(parsedUrl)

  if (!parsedUrl || !origin || !isHostOf(parsedUrl, avatarHosts)) {
    return
  }

  return `${origin}${parsedUrl.pathname}${avatarQuery}`
}

export const postypeHandler: PlatformHandler = {
  match: (url) => {
    return parsePostypeUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parsePostypeUrl(url)

    if (!parsed) {
      return []
    }

    // A post page carries the post cover as its og:image.
    if (content && parsed.kind === 'channel') {
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
