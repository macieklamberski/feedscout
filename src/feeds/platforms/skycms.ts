import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const pageRegex = /^\/(\d+)\/([^/]+)\.html$/i
const rssListRegex = /\/\d+\/lista-kanalow-rss\.html$/i
const templateRegex = /\/(?:cms\/public|clients\/cms_[^/]+)\/image\/default\/bip(?:_v\d+)?\//

export type SkycmsUrl = { kind: 'page'; pageId: string; slug: string }

// SkyCMS sets its counter cookie whenever the page differs from the one the cookie holds.
export const isSkycmsHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('skycms_PageCounter')
}

// The bulletin template loads its icons from `/cms/public/image/default/bip_v{n}/`, or from
// `/clients/cms_{client}/image/default/bip/` when branded, so the marker holds without headers.
export const isSkycmsHtml = (content: string): boolean => {
  const link = findElement(content, (element) => {
    return element.name === 'link' && templateRegex.test(element.attribs.href ?? '')
  })

  return link !== undefined
}

// Only the public information bulletin template serves page feeds, and every page of it links
// the list of those feeds. A SkyCMS municipal site answers `/rss/{id}/{slug}.html` with 404.
export const hasSkycmsRssList = (content: string | undefined): boolean => {
  const link = findElement(content, (element) => {
    return element.name === 'a' && rssListRegex.test(element.attribs.href ?? '')
  })

  return link !== undefined
}

export const parseSkycmsUrl = (url: string): SkycmsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const match = parsedUrl.pathname.match(pageRegex)

  if (!match?.[1] || !match[2]) {
    return
  }

  return { kind: 'page', pageId: match[1], slug: match[2] }
}

export const skycmsHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isSkycmsHtml, headers: isSkycmsHeaders })) {
      return false
    }

    if (!hasSkycmsRssList(content)) {
      return false
    }

    return parseSkycmsUrl(url) !== undefined
  },

  resolve: (url) => {
    const skycmsUrl = parseSkycmsUrl(url)

    if (!skycmsUrl) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/rss/${skycmsUrl.pageId}/${skycmsUrl.slug}.html`,
        hint: composeHint('skycms:page', 'rss'),
      },
    ]
  },
}
