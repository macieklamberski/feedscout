import { wix } from 'feedintel'
import { getPathSegments, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WixUrl = { kind: 'freeSite'; site: string } | { kind: 'site' }

const domains = wix.hosts.tenants
const assetHosts = ['static.parastorage.com']

const feeds = withHintLabels(wix.feeds)

export const isWixHtml = (content: string): boolean => {
  if (hasMetaContent(content, 'generator', 'Wix.com')) {
    return true
  }

  const script = findElement(content, (element) => {
    return element.name === 'script' && isHostOf(element.attribs.src ?? '', assetHosts)
  })

  return script !== undefined
}

export const isWixHeaders = (headers: Headers): boolean => {
  return headers.has('x-wix-request-id')
}

// A free site lives under a path on `{account}.wixsite.com` or `{account}.wixstudio.com`, whose
// root answers 404.
export const parseWixUrl = (url: string): WixUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [site] = getPathSegments(parsedUrl)

  if (isSubdomainOf(parsedUrl, domains) && site) {
    return { kind: 'freeSite', site }
  }

  return { kind: 'site' }
}

export const wixHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isWixHtml, headers: isWixHeaders })) {
      return false
    }

    return parseWixUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWixUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'freeSite') {
      return [page.getFeedEntry('blog', { site: parsed.site })]
    }

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
