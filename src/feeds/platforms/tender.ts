import {
  composeQuery,
  decodeSegment,
  isHostOrSubdomainOf,
  parseUrl,
  startsWithAnyOf,
} from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TenderPage =
  | { kind: 'site'; siteUrl: string }
  | { kind: 'discussion'; siteUrl: string; category: string; discussion: string }

const domains = ['tenderapp.com']

const settingsLineRegex = /\bTender = \{[^\n]*/
const settingsRootRegex = /"root":"(?<root>\/[^"]*)"/
const sessionCookieRegex = /^_tender\d*_session$/
const helpRootRegex = /^\/help(?:\/|$)/i
const discussionPathRegex = /^\/discussions\/(?<category>[^/]+)\/(?<discussion>\d+[^/]*)\/?$/i
const discussionsFeedPathRegex = /^\/discussions\.atom\/?$/i
const commentsFeedPathRegex = /^\/comments\/recent\.atom\/?$/i
const discussionFeedPathRegex = /^\/discussions\/[^/]+\/\d+[^/]*\.atom\/?$/i
const trailingSlashRegex = /\/$/
// A missing page answers 404 with the stock Rails error page inside the site layout, and a
// made-up category would otherwise get the site's feed.
const errorPageRegex = /<!-- This file lives in public\/404\.html -->/

const getSettingsRoot = (content: string | undefined): string | undefined => {
  const settingsLine = content?.match(settingsLineRegex)?.[0]

  return settingsLine?.match(settingsRootRegex)?.groups?.root
}

// Every page head prints the `Tender` settings script, custom domains too.
export const isTenderHtml = (content: string): boolean => {
  return getSettingsRoot(content) !== undefined
}

export const isTenderHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => sessionCookieRegex.test(name))
}

// A site can live under `/help/`, which the settings script names as its root.
const getRoot = (pathname: string, content: string | undefined): string => {
  const root = getSettingsRoot(content)

  if (root) {
    return root.replace(trailingSlashRegex, '')
  }

  if (helpRootRegex.test(pathname)) {
    return '/help'
  }

  return ''
}

const getSitePath = (pathname: string, root: string): string => {
  return startsWithAnyOf(pathname, `${root}/`) ? pathname.slice(root.length) : '/'
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

  if (isHostOrSubdomainOf(url, domains) && !getTenantSubdomain(url, domains)) {
    return
  }

  const root = getRoot(parsedUrl.pathname, content)
  const siteUrl = `${parsedUrl.origin}${root}`
  const sitePath = getSitePath(parsedUrl.pathname, root)
  const { category, discussion } = discussionPathRegex.exec(sitePath)?.groups ?? {}

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
      const query = composeQuery({ discussion_id: decodeSegment(discussion) ?? discussion })

      return [
        {
          uri: `${siteUrl}/discussions/${category}/${discussion}.atom${query}`,
          hint: composeHint('tender:discussion'),
        },
      ]
    }

    return [
      { uri: `${page.siteUrl}/discussions.atom`, hint: composeHint('tender:discussions') },
      { uri: `${page.siteUrl}/comments/recent.atom`, hint: composeHint('tender:comments') },
    ]
  },

  // A site's root comes from its settings script and a custom domain carries no marker in the URL
  // alone, so only a feed on a Tender host is read, under its origin or `/help`.
  getFeedHint: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !getTenantSubdomain(url, domains)) {
      return
    }

    const sitePath = getSitePath(parsedUrl.pathname, getRoot(parsedUrl.pathname, undefined))

    if (discussionsFeedPathRegex.test(sitePath)) {
      return composeHint('tender:discussions')
    }

    if (commentsFeedPathRegex.test(sitePath)) {
      return composeHint('tender:comments')
    }

    // A discussion answers its feed with or without the `discussion_id` the page links.
    if (discussionFeedPathRegex.test(sitePath)) {
      return composeHint('tender:discussion')
    }
  },
}
