import { eklablog } from 'feedintel'
import { isHostOf, isHostOrSubdomainOf, resolveUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: comments.

export type EklablogUrl = { kind: 'blog' } | { kind: 'customDomain' }

// Eklablog serves blogs on 20 domains. Only its branded one is listed, and a blog on another one or
// on a custom domain is known by its marker.
const domains = eklablog.hosts.tenants
const connectHosts = ['connect.eklablog.com']

const feeds = withHintLabels(eklablog.feeds)

const isConnectScript = (src: string | undefined): boolean => {
  return isHostOf(resolveUrl(src ?? '') ?? '', connectHosts)
}

// Every blog page loads the login ping script from connect.eklablog.com, on a custom domain too.
export const isEklablogHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && isConnectScript(element.attribs.src)
  })

  return script !== undefined
}

export const parseEklablogUrl = (url: string): EklablogUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return { kind: 'customDomain' }
  }

  const subdomain = getTenantSubdomain(url, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'blog' }
}

export const eklablogHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseEklablogUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isEklablogHtml })
    }

    return parsed !== undefined
  },

  resolve: (url) => {
    const parsed = parseEklablogUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('posts'), pageFeeds.getFeedEntry('comments')]
  },

  getFeedHint: feeds.getFeedHint,
}
