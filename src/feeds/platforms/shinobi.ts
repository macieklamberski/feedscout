import { shinobi } from 'feedintel'
import { isAnyOf, isHostOrSubdomainOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShinobiUrl = { kind: 'blog'; blog: string }

// Ninja Blog serves its blogs as subdomains of 101 domains. Only its branded one is listed, and a
// blog on any other is known by the banner its pages print.
const domains = shinobi.hosts.tenants

const feeds = withHintLabels(shinobi.feeds)

// Every blog page prints the Ninja Blog banner, whose logo loads from the blog's own host.
export const isShinobiHtml = (content: string): boolean => {
  const logo = findElement(content, (element) => {
    return element.name === 'img' && isAnyOf(element.attribs.src, '/admin/img/blogheader_logo.png')
  })

  return logo !== undefined
}

export const parseShinobiUrl = (url: string): ShinobiUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const shinobiHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!isHostOrSubdomainOf(url, domains)) {
      return hasMarker(content, headers, { html: isShinobiHtml })
    }

    return parseShinobiUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page || (isHostOrSubdomainOf(url, domains) && !parseShinobiUrl(url))) {
      return []
    }

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'atom'),
      page.getFeedEntry('posts', {}, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
