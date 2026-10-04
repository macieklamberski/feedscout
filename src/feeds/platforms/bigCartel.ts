import { getSubdomain, isAnyOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers store (html).
// Handler needed for: customDomainStore.

export type BigCartelUrl = { kind: 'store' }

const domains = ['bigcartel.com']

const frameOptionsRegex = /https:\/\/my\.bigcartel\.com/i
const themeStylesheetRegex = /^\/theme_stylesheets\/\d+\/\d+\/theme\.css$/

// The domain has wildcard DNS, so these Big Cartel services sit beside the stores.
const excludedSubdomains = [
  'api',
  'app',
  'assets',
  'blog',
  'developers',
  'email',
  'files',
  'help',
  'images',
  'jobs',
  'mail',
  'my',
  'stats',
  'status',
  'www',
]

export const isBigCartelHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel?.toLowerCase() === 'stylesheet' &&
      themeStylesheetRegex.test(element.attribs.href ?? '')
    )
  })

  return stylesheet !== undefined
}

export const isBigCartelHeaders = (headers: Headers): boolean => {
  return frameOptionsRegex.test(headers.get('x-frame-options') ?? '')
}

export const parseBigCartelUrl = (url: string): BigCartelUrl | undefined => {
  const store = getSubdomain(url, domains)

  if (!store || store.includes('.') || isAnyOf(store, excludedSubdomains)) {
    return
  }

  return { kind: 'store' }
}

export const bigCartelHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isHostOrSubdomainOf(url, domains)) {
      return parseBigCartelUrl(url) !== undefined
    }

    return hasMarker(content, headers, { html: isBigCartelHtml, headers: isBigCartelHeaders })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    // The linked `/products.xml` is a Google Merchant feed whose items have no title or link, so it
    // parses with no items.
    return [{ uri: `${origin}/products.rss`, hint: composeHint('big-cartel:products') }]
  },
}
