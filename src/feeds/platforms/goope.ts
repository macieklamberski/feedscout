import {
  getPathSegments,
  isAnyOf,
  isHostOf,
  isHostOrSubdomainOf,
  parseUrl,
  resolveUrl,
} from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GoopeUrl = {
  kind: 'freeSite' | 'site'
  site?: string
  templateId?: string
  isMemberPage: boolean
  isAssociationPage: boolean
}

const hosts = ['r.goope.jp']
const domains = ['goope.jp']
const assetHosts = ['cdn.goope.jp']

const templateRegex = /^t_(\d+)$/i
const qrCodePathRegex = /^\/qr\//i

// A key's template row comes before its plain row, so a page with a template id builds under it.
const freeSiteFeeds = definePlatformFeeds([
  {
    key: 'goope:member-news',
    template: 'https://r.goope.jp/{site}/t_{templateId}/shokokai/member/feed.rss',
    format: 'rdf',
  },
  {
    key: 'goope:member-news',
    template: 'https://r.goope.jp/{site}/shokokai/member/feed.rss',
    format: 'rdf',
  },
  {
    key: 'goope:news',
    template: 'https://r.goope.jp/{site}/t_{templateId}/feed.rss',
    format: 'rdf',
  },
  { key: 'goope:news', template: 'https://r.goope.jp/{site}/feed.rss', format: 'rdf' },
  // A federation of chambers of commerce collects its chambers' news under /shokokai.
  {
    key: 'goope:association-news',
    template: 'https://r.goope.jp/{site}/shokokai/feed.rss',
    format: 'rdf',
  },
])

// A site on its own domain is known only by its markers, so its feeds are built but not claimed.
// Claimed, these rows would read r.goope.jp/shokokai/member/feed.rss, a redirect to goope.jp.
const siteFeeds = definePlatformFeeds(
  [
    {
      key: 'goope:member-news',
      template: '{scheme}://{host}/t_{templateId}/shokokai/member/feed.rss',
      format: 'rdf',
    },
    {
      key: 'goope:member-news',
      template: '{scheme}://{host}/shokokai/member/feed.rss',
      format: 'rdf',
    },
    { key: 'goope:news', template: '{scheme}://{host}/t_{templateId}/feed.rss', format: 'rdf' },
    { key: 'goope:news', template: '{scheme}://{host}/feed.rss', format: 'rdf' },
    {
      key: 'goope:association-news',
      template: '{scheme}://{host}/shokokai/feed.rss',
      format: 'rdf',
    },
  ],
  { hosts },
)

const isQrCode = (src: string | undefined): boolean => {
  const qrCodeUrl = parseUrl(resolveUrl(src ?? ''))

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

  // A `t_{id}` segment serves the site in another template, and its pages link the feed under it.
  const [templateOrSection] = segments
  const templateId = templateOrSection?.match(templateRegex)?.[1]

  if (templateId) {
    segments.shift()
  }

  const [section, page] = segments
  const isAssociationPage = isAnyOf(section, 'shokokai')
  const isMemberPage = isAssociationPage && isAnyOf(page, 'member')

  return { kind, site, templateId, isMemberPage, isAssociationPage }
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

    const pageFeeds = (parsed.kind === 'freeSite' ? freeSiteFeeds : siteFeeds).forUrl(url)

    if (!pageFeeds) {
      return []
    }

    const params = { site: parsed.site, templateId: parsed.templateId }

    // A chamber of commerce site collects its members' news under /shokokai/member.
    if (parsed.isMemberPage) {
      return [
        pageFeeds.getFeedEntry('goope:member-news', params, 'rdf'),
        pageFeeds.getFeedEntry('goope:news', params, 'rdf'),
      ]
    }

    if (parsed.isAssociationPage) {
      return [
        pageFeeds.getFeedEntry('goope:association-news', params, 'rdf'),
        pageFeeds.getFeedEntry('goope:news', params, 'rdf'),
      ]
    }

    return [pageFeeds.getFeedEntry('goope:news', params, 'rdf')]
  },

  getFeedHint: freeSiteFeeds.getFeedHint,
}
