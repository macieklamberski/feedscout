import { decodeSegment, isHostOrSubdomainOf, parseUrl, startsWithAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

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
const discussionFeedPathRegex = /\/\d+[^/]*\.atom\/?$/i
const trailingSlashRegex = /\/$/
// A missing page answers 404 with the stock Rails error page inside the site layout, and a
// made-up category would otherwise get the site's feed.
const errorPageRegex = /<!-- This file lives in public\/404\.html -->/

// A site's root comes from its settings script, which a feed URL does not carry, so the table
// claims a feed on a Tender host under its origin or `/help` only. A custom domain carries no
// marker in the URL alone, so its feeds are built here but not claimed.
const feeds = definePlatformFeeds(
  'tender',
  [
    { key: 'discussions', main: '{root}/discussions.atom' },
    { key: 'discussions', main: '{root}/help/discussions.atom' },
    { key: 'comments', main: '{root}/comments/recent.atom' },
    { key: 'comments', main: '{root}/help/comments/recent.atom' },
    // The page links its comments feed with the discussion repeated as `discussion_id`, and the
    // feed answers without it too.
    {
      key: 'discussion',
      main: '{root}/discussions/{category}/{discussion}.atom?discussion_id={discussionId}',
      aliases: ['{root}/discussions/{category}/{discussion}.atom'],
    },
    { key: 'discussion', main: '{root}/help/discussions/{category}/{discussion}.atom' },
  ],
  { hosts: { tenants: domains } },
)

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
      const discussionId = decodeSegment(discussion) ?? discussion

      return [
        feeds.getFeedEntry('discussion', {
          root: siteUrl,
          category,
          discussion,
          discussionId,
        }),
      ]
    }

    return [
      feeds.getFeedEntry('discussions', { root: page.siteUrl }),
      feeds.getFeedEntry('comments', { root: page.siteUrl }),
    ]
  },

  // A discussion's id leads its path segment, and `new.atom` under a category is the form for a
  // new discussion.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (hint?.key === 'tender:discussion' && !discussionFeedPathRegex.test(new URL(url).pathname)) {
      return
    }

    return hint
  },
}
