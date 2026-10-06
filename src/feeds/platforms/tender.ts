import { getSubdomain, isAnyOf, isHostOrSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TenderPage =
  | { kind: 'site'; siteUrl: string }
  | { kind: 'discussion'; siteUrl: string; category: string; discussion: string }

const domains = ['tenderapp.com']

const settingsRootRegex = /\bTender = \{[^\n]*?"root":"(\/[^"]*)"/
const sessionCookieRegex = /^_tender\d*_session$/
const helpRootRegex = /^\/help(?:\/|$)/i
const discussionPathRegex = /^\/discussions\/([^/]+)\/(\d+[^/]*)\/?$/i
const trailingSlashRegex = /\/$/
// A missing page answers 404 with the stock Rails error page inside the site layout, and a
// made-up category would otherwise get the site's feed.
const errorPageRegex = /<!-- This file lives in public\/404\.html -->/

// The marketing site, the API, the custom domain SSL endpoint, and hosts that redirect every path
// to help.tenderapp.com/home.
const excludedSubdomains = ['api', 'blog', 'setup', 'ssl', 'status', 'support', 'www']

// Every page head prints the `Tender` settings script, custom domains too.
export const isTenderHtml = (content: string): boolean => {
  return settingsRootRegex.test(content)
}

export const isTenderHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => sessionCookieRegex.test(name))
}

// A site can live under `/help/`, which the settings script names as its root.
const getRoot = (pathname: string, content: string | undefined): string => {
  const root = content?.match(settingsRootRegex)?.[1]

  if (root) {
    return root.replace(trailingSlashRegex, '')
  }

  if (helpRootRegex.test(pathname)) {
    return '/help'
  }

  return ''
}

export const getTenderPage = (url: string, content: string | undefined): TenderPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // Asked for anything but `text/html`, a missing page answers a bare line of text without the
  // settings script, and a discussion page answers its own Atom feed.
  if (content && (!isTenderHtml(content) || errorPageRegex.test(content))) {
    return
  }

  if (isHostOrSubdomainOf(url, domains)) {
    const site = getSubdomain(url, domains)

    if (!site || site.includes('.') || isAnyOf(site, excludedSubdomains)) {
      return
    }
  }

  const root = getRoot(parsedUrl.pathname, content)
  const siteUrl = `${parsedUrl.origin}${root}`
  const sitePath = parsedUrl.pathname.startsWith(`${root}/`)
    ? parsedUrl.pathname.slice(root.length)
    : '/'
  const [, category, discussion] = sitePath.match(discussionPathRegex) ?? []

  if (category && discussion) {
    return { kind: 'discussion', siteUrl, category, discussion }
  }

  return { kind: 'site', siteUrl }
}

export const tenderHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const isHosted = isHostOrSubdomainOf(url, domains)
    const markers = { html: isTenderHtml, headers: isTenderHeaders }

    if (!isHosted && !hasMarker(content, headers, markers)) {
      return false
    }

    return getTenderPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getTenderPage(url, content)

    if (!page) {
      return []
    }

    if (page.kind === 'discussion') {
      const { siteUrl, category, discussion } = page

      // The page links its comments feed with the discussion repeated as `discussion_id`.
      return [
        {
          uri: `${siteUrl}/discussions/${category}/${discussion}.atom?discussion_id=${discussion}`,
          hint: composeHint('tender:discussion'),
        },
      ]
    }

    return [{ uri: `${page.siteUrl}/discussions.atom`, hint: composeHint('tender:discussions') }]
  },
}
