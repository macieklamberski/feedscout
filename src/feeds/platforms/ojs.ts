import { getPathSegments, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findElement,
  getCookieNames,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, issue (html), partly covers article.

// OJS loads its theme stylesheets through the component router under the journal's root.
const componentRouterRegex = /^(https?:\/\/.+?)\/\$\$\$call\$\$\$\//i

export type OjsPage = { kind: 'journal'; journalUrl: string }

export const isOjsHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Open Journal Systems')
}

export const isOjsHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('OJSSID')
}

export const getOjsPage = (content: string | undefined): OjsPage | undefined => {
  const stylesheet = findElement(content, (element) => {
    return element.name === 'link' && componentRouterRegex.test(element.attribs.href ?? '')
  })
  const rootUrl = stylesheet?.attribs.href?.match(componentRouterRegex)?.[1]

  if (!rootUrl) {
    return
  }

  // The site-wide pages of a multi-journal install sit under the reserved `index` path.
  if (isAnyOf(getPathSegments(rootUrl).at(-1), 'index')) {
    return
  }

  // An OJS 3.5 locale feed url loops on a cookie redirect without a cookie, so the root, which
  // redirects to the default locale, is emitted.
  return { kind: 'journal', journalUrl: rootUrl }
}

export const ojsHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    if (!hasMarker(content, headers, { html: isOjsHtml, headers: isOjsHeaders })) {
      return false
    }

    return getOjsPage(content) !== undefined
  },

  resolve: (_url, content) => {
    const page = getOjsPage(content)

    if (!page) {
      return []
    }

    const articles = `${page.journalUrl}/gateway/plugin/WebFeedGatewayPlugin`
    const announcements = `${page.journalUrl}/gateway/plugin/AnnouncementFeedGatewayPlugin`

    return [
      { uri: `${articles}/atom`, hint: composeHint('ojs:articles', 'atom') },
      { uri: `${articles}/rss`, hint: composeHint('ojs:articles', 'rdf') },
      { uri: `${articles}/rss2`, hint: composeHint('ojs:articles', 'rss') },
      { uri: `${announcements}/atom`, hint: composeHint('ojs:announcements', 'atom') },
      { uri: `${announcements}/rss`, hint: composeHint('ojs:announcements', 'rdf') },
      { uri: `${announcements}/rss2`, hint: composeHint('ojs:announcements', 'rss') },
    ]
  },
}
