import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// PukiWiki 1.4 serves the default stylesheet as `pukiwiki.css.php`, 1.5 as `pukiwiki.css`.
const stylesheetRegex = /(?:^|\/)pukiwiki\.css(?:\.php)?(?:[?#]|$)/i
// Quick Homepage Maker, a PukiWiki fork, numbers its session cookie per install.
const sessionCookieRegex = /^QHMSSID\d*$/
const skinRootRegex = /^(.*?\/)skin\//
const scriptPathRegex = /\.php$/i

export type PukiwikiPage = { kind: 'wiki'; scriptUrl: string }

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
  const stylesheetUrl = stylesheet?.attribs.href ? new URL(stylesheet.attribs.href, url) : undefined

  const root =
    stylesheetUrl?.origin === origin ? stylesheetUrl.pathname.match(skinRootRegex)?.[1] : undefined

  if (scriptPathRegex.test(pathname) || !root || !pathname.startsWith(root)) {
    return { kind: 'wiki', scriptUrl: `${origin}${pathname}` }
  }

  return { kind: 'wiki', scriptUrl: `${origin}${root}` }
}

export const pukiwikiHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isPukiwikiHtml, headers: isPukiwikiHeaders })
  },

  resolve: (url, content) => {
    const page = getPukiwikiPage(url, content)

    return [
      {
        uri: `${page.scriptUrl}?cmd=rss`,
        hint: composeHint('pukiwiki:recent-changes'),
      },
    ]
  },
}
