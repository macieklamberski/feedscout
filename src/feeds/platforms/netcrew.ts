import { netcrew } from 'feedintel'
import { DomUtils } from 'htmlparser2'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: updates.

export type NetcrewUrl = { kind: 'home' }

const searchScriptRegex = /^\/ssi\/js\/search-trend\.js(?:\?|$)/i
const styleImportRegex = /@import\s+url\(["']?\/ssi\/css\//i

const feeds = withHintLabels(netcrew.feeds)

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
  if (!netcrew.pages.read(url, { root: parseUrl(url)?.origin ?? '' })) {
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

    return [pageFeeds.getFeedSpellings('updates')]
  },
}
