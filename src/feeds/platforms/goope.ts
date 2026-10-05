import {
  getPathSegments,
  isAnyOf,
  isHostOf,
  isHostOrSubdomainOf,
  parseUrl,
  resolveUrl,
} from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GoopeUrl = { kind: 'freeSite' | 'site'; sitePath: string; isMemberPage: boolean }

const hosts = ['r.goope.jp']
const domains = ['goope.jp']
const assetHosts = ['cdn.goope.jp']

const templateRegex = /^t_(\d+)$/i
const qrCodePathRegex = /^\/qr\//i

const isQrCode = (src: string | undefined): boolean => {
  const qrCodeUrl = parseUrl(resolveUrl(src ?? '') ?? '')

  if (!qrCodeUrl) {
    return false
  }

  return isHostOf(qrCodeUrl, hosts) && qrCodePathRegex.test(qrCodeUrl.pathname)
}

const isGoopeAsset = (href: string | undefined): boolean => {
  return isHostOf(resolveUrl(href ?? '') ?? '', assetHosts)
}

// Every theme prints the site's QR code from r.goope.jp unless the owner hides it, and a favicon
// uploaded to the site loads from cdn.goope.jp.
export const isGoopeHtml = (content: string): boolean => {
  const element = findElement(content, (element) => {
    if (element.name === 'img') {
      return isQrCode(element.attribs.src)
    }

    if (element.name === 'link') {
      return isGoopeAsset(element.attribs.href)
    }

    return false
  })

  return element !== undefined
}

export const parseGoopeUrl = (url: string): GoopeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const segments = getPathSegments(parsedUrl)
  let kind: GoopeUrl['kind'] = 'site'
  let sitePath = ''

  if (isHostOf(parsedUrl, hosts)) {
    const site = segments.shift()

    // The root of r.goope.jp redirects to goope.jp.
    if (!site) {
      return
    }

    kind = 'freeSite'
    sitePath = `/${site}`
  } else if (isHostOrSubdomainOf(parsedUrl, domains)) {
    return
  }

  // A `t_{id}` segment serves the site in another template, and its pages link the feed under it.
  const templateId = segments[0]?.match(templateRegex)?.[1]

  if (templateId) {
    segments.shift()
    sitePath = `${sitePath}/t_${templateId}`
  }

  const isMemberPage = isAnyOf(segments[0], 'shokokai') && isAnyOf(segments[1], 'member')

  return { kind, sitePath, isMemberPage }
}

export const goopeHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseGoopeUrl(url)

    if (parsed?.kind === 'site') {
      return hasMarker(content, headers, { html: isGoopeHtml })
    }

    return parsed !== undefined
  },

  resolve: (url) => {
    const parsed = parseGoopeUrl(url)

    if (!parsed) {
      return []
    }

    const siteUrl = `${new URL(url).origin}${parsed.sitePath}`
    const uris: Array<DiscoverUriEntry> = []

    // A chamber of commerce site collects its members' news under /shokokai/member.
    if (parsed.isMemberPage) {
      uris.push({
        uri: `${siteUrl}/shokokai/member/feed.rss`,
        hint: composeHint('goope:member-news', 'rdf'),
      })
    }

    uris.push({ uri: `${siteUrl}/feed.rss`, hint: composeHint('goope:news', 'rdf') })

    return uris
  },
}
