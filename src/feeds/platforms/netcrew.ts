import { DomUtils } from 'htmlparser2'
import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type NetcrewUrl = { kind: 'home' }

const homePathRegex = /^\/(?:index\.html)?$/i
const searchScriptRegex = /^\/ssi\/js\/search-trend\.js(?:\?|$)/i
const styleImportRegex = /@import\s+url\(["']?\/ssi\/css\//i

// NetCrew CMS runs on each site's own domain and is known only by its page marker, so nothing in a
// feed URL names it and the table only builds. The list id names the format, `10` for RSS 1.0 and
// `20` for RSS 2.0. An install serves one of the two, so both are spellings of one feed, tried in
// turn.
const feeds = definePlatformFeeds([
  { key: 'netcrew:updates', template: '{root}/rss/10/list1.xml' },
  { key: 'netcrew:updates', template: '{root}/rss/20/list1.xml', isAlias: true },
])

// Every NetCrew CMS template loads its search script from `/ssi/js/search-trend.js` and its styles
// from `/ssi/css/` at the site root.
export const isNetcrewHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && searchScriptRegex.test(element.attribs.src ?? '')
  })
  const stylesheet = findElement(content, (element) => {
    if (element.name === 'link') {
      return (element.attribs.href ?? '').startsWith('/ssi/css/')
    }

    // Some templates load every stylesheet through an import in a style element.
    if (element.name === 'style') {
      return styleImportRegex.test(DomUtils.textContent(element))
    }

    return false
  })

  return script !== undefined && stylesheet !== undefined
}

// Section feeds are named by internal ids the page url does not carry, so only the home page is
// parsed. A section page links its own feed.
export const parseNetcrewUrl = (url: string): NetcrewUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !homePathRegex.test(parsedUrl.pathname)) {
    return
  }

  return { kind: 'home' }
}

export const netcrewHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isNetcrewHtml })) {
      return false
    }

    return parseNetcrewUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNetcrewUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedSpellings('netcrew:updates')]
  },
}
