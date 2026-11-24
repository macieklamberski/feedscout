import { goope } from 'feedintel'
import { parseUrl, resolveUrl } from 'trousse'
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

const feeds = withHintLabels(goope.feeds)

const isQrCode = (src: string | undefined): boolean => {
  return goope.pages.read(resolveUrl(src ?? '') ?? '')?.key === 'qr'
}

const isGoopeAsset = (href: string | undefined): boolean => {
  return goope.pages.read(resolveUrl(href ?? '') ?? '')?.key === 'asset'
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

  // The root of r.goope.jp redirects to goope.jp.
  const page = goope.pages.read(url) ?? goope.pages.read(url, { root: parsedUrl.origin })

  if (!page || page.key === 'platform' || page.key === 'qr' || page.key === 'asset') {
    return
  }

  const { site } = page.params

  return {
    kind: site ? 'freeSite' : 'site',
    site,
    isMemberPage: page.key === 'members',
    isAssociationPage: page.key !== 'site',
  }
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
