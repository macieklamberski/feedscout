import { pukiwiki } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PukiwikiPage = { kind: 'wiki'; scriptUrl: string }

// PukiWiki 1.4 serves the default stylesheet as `pukiwiki.css.php`, 1.5 as `pukiwiki.css`.
const stylesheetRegex = /(?:^|\/)pukiwiki\.css(?:\.php)?(?:[?#]|$)/i
// Quick Homepage Maker, a PukiWiki fork, numbers its session cookie per install.
const sessionCookieRegex = /^QHMSSID\d*$/

const feeds = withHintLabels(pukiwiki.feeds)

export const isPukiwikiHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return element.name === 'link' && stylesheetRegex.test(element.attribs.href ?? '')
  })

  return stylesheet !== undefined
}

export const isPukiwikiHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => sessionCookieRegex.test(name))
}

// Most pages are a query on the wiki's script, `index.php` or its directory, so the page's path is
// the script. A rewrite install serves pages as paths, where `?cmd=rss` answers with the page
// itself, so the root comes from the default stylesheet. It names the root only when it sits in a
// `skin/` directory above the page: wiki farms share a `skin/` elsewhere, and some sites move it.
export const getPukiwikiPage = (url: string, content: string | undefined): PukiwikiPage => {
  const { origin, pathname } = new URL(url)
  const stylesheet = findElement(content, (element) => {
    return element.name === 'link' && stylesheetRegex.test(element.attribs.href ?? '')
  })
  const stylesheetUrl = parseUrl(stylesheet?.attribs.href, url)
  const skin = stylesheetUrl
    ? pukiwiki.pages.read(stylesheetUrl.href, { isAnyHost: true })
    : undefined
  const isScript = pukiwiki.pages.read(url, { isAnyHost: true })?.key === 'script'

  if (isScript || skin?.key !== 'skin' || !pukiwiki.pages.read(url, { root: skin.params.root })) {
    return { kind: 'wiki', scriptUrl: `${origin}${pathname}` }
  }

  return { kind: 'wiki', scriptUrl: `${skin.params.root}/` }
}

export const pukiwikiHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isPukiwikiHtml, headers: isPukiwikiHeaders })
  },

  resolve: (url, content) => {
    const page = getPukiwikiPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    const directoryUrl = new URL('./', page.scriptUrl).href
    const script = page.scriptUrl.slice(directoryUrl.length) || undefined

    return [pageFeeds.getFeedEntry('recent-changes', { root: directoryUrl, script })]
  },
}
