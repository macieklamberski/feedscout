import { getPathSegments, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WixUrl = { kind: 'freeSite'; site: string } | { kind: 'site' }

const domains = ['wixsite.com']
const assetHosts = ['static.parastorage.com']

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

// A free site lives under a path on `{account}.wixsite.com`, whose root answers 404.
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

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    if (parsed.kind === 'freeSite') {
      return [{ uri: `${origin}/${parsed.site}/blog-feed.xml`, hint: composeHint('wix:blog') }]
    }

    return [{ uri: `${origin}/blog-feed.xml`, hint: composeHint('wix:blog') }]
  },
}
