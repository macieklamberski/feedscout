import { shinobi } from 'feedintel'
import { isAnyOf, isHostOrSubdomainOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShinobiUrl = { kind: 'blog'; blog: string }

// Ninja Blog serves its blogs as subdomains of 101 domains. Only its branded one is listed, and a
// blog on any other is known by the banner its pages print.
const feeds = withHintLabels(shinobi.feeds)

// Every blog page prints the Ninja Blog banner, whose logo loads from the blog's own host.
export const isShinobiHtml = (content: string): boolean => {
  const logo = findElement(content, (element) => {
    return element.name === 'img' && isAnyOf(element.attribs.src, '/admin/img/blogheader_logo.png')
  })

  return logo !== undefined
}

export const parseShinobiUrl = (url: string): ShinobiUrl | undefined => {
  const page = shinobi.pages.read(url)

  if (page?.key !== 'blog') {
    return
  }

  return { kind: 'blog', blog: page.params.blog }
}

export const shinobiHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const page = shinobi.pages.read(url)

    if (page) {
      return page.key === 'blog'
    }

    if (isHostOrSubdomainOf(url, shinobi.hosts.tenants)) {
      return false
    }

    return hasMarker(content, headers, { html: isShinobiHtml })
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (isHostOrSubdomainOf(url, shinobi.hosts.tenants) && !parseShinobiUrl(url)) {
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
