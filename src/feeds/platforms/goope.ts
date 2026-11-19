import { goope } from 'feedintel'
import {
  getPathSegments,
  isAnyOf,
  isHostOf,
  isHostOrSubdomainOf,
  parseUrl,
  resolveUrl,
  startsWithAnyOf,
} from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GoopeUrl = {
  kind: 'freeSite' | 'site'
  site?: string
  isMemberPage: boolean
  isAssociationPage: boolean
}

const hosts = goope.hosts.exact
const domains = ['goope.jp']
const assetHosts = ['cdn.goope.jp']

const templateRegex = /^t_\d+$/i

const feeds = withHintLabels(goope.feeds)

const isQrCode = (src: string | undefined): boolean => {
  const qrCodeUrl = parseUrl(resolveUrl(src ?? ''))

  if (!qrCodeUrl) {
    return false
  }

  return isHostOf(qrCodeUrl, hosts) && startsWithAnyOf(qrCodeUrl.pathname, '/qr/')
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
  let site: string | undefined

  if (isHostOf(parsedUrl, hosts)) {
    site = segments.shift()

    // The root of r.goope.jp redirects to goope.jp.
    if (!site) {
      return
    }

    kind = 'freeSite'
  } else if (isHostOrSubdomainOf(parsedUrl, domains)) {
    return
  }

  // A `t_{id}` segment serves the site in another template.
  const [templateOrSection] = segments

  if (templateRegex.test(templateOrSection ?? '')) {
    segments.shift()
  }

  const [section, page] = segments
  const isAssociationPage = isAnyOf(section, 'shokokai')
  const isMemberPage = isAssociationPage && isAnyOf(page, 'member')

  return { kind, site, isMemberPage, isAssociationPage }
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

    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    const params = { site: parsed.site }

    // A chamber of commerce site collects its members' news under /shokokai/member.
    if (parsed.isMemberPage) {
      return [
        pageFeeds.getFeedEntry('member-news', params, 'rdf'),
        pageFeeds.getFeedEntry('news', params, 'rdf'),
      ]
    }

    if (parsed.isAssociationPage) {
      return [
        pageFeeds.getFeedEntry('association-news', params, 'rdf'),
        pageFeeds.getFeedEntry('news', params, 'rdf'),
      ]
    }

    return [pageFeeds.getFeedEntry('news', params, 'rdf')]
  },

  getFeedHint: feeds.getFeedHint,
}
