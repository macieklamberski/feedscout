import { getPathSegments, getQueryParam, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: group-changes, site-changes.

export type PmwikiUrl =
  | { kind: 'page'; scriptPath: string; group: string }
  | { kind: 'home'; scriptPath: string }

// PmWiki names a group with a leading capital, so the first such segment ends the script path.
const groupRegex = /^\p{Lu}[\p{L}\d_]*(?:-[\p{L}\d_]+)*$/u
const pageNameSeparatorRegex = /[./]/

// A wiki is known only by its markup, so its feeds are built on the script URL and claimed on no
// host. The query form answers under clean URLs, path info and the bare script alike.
const feeds = definePlatformFeeds('pmwiki', [
  { key: 'group-changes', main: '{root}?n={group}.RecentChanges&action=rss', format: 'rss' },
  {
    key: 'group-changes',
    main: '{root}?n={group}.RecentChanges&action=atom',
    format: 'atom',
  },
  { key: 'site-changes', main: '{root}?n=Site.AllRecentChanges&action=rss', format: 'rss' },
  {
    key: 'site-changes',
    main: '{root}?n=Site.AllRecentChanges&action=atom',
    format: 'atom',
  },
])

// Every skin template carries the directive comment, and PmWiki prints it into the page.
export const isPmwikiHtml = (content: string): boolean => {
  return content.includes('<!--HTMLHeader-->')
}

export const parsePmwikiUrl = (url: string): PmwikiUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const pageName = getQueryParam(parsedUrl.searchParams, 'n')
  const [nameGroup] = pageName?.split(pageNameSeparatorRegex) ?? []

  if (nameGroup) {
    return { kind: 'page', scriptPath: parsedUrl.pathname, group: nameGroup }
  }

  const segments = getPathSegments(url)
  const group = segments.find((segment) => groupRegex.test(segment))

  if (!group) {
    return { kind: 'home', scriptPath: parsedUrl.pathname }
  }

  const scriptPath = `/${segments.slice(0, segments.indexOf(group)).join('/')}`

  return { kind: 'page', scriptPath, group }
}

export const pmwikiHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPmwikiHtml })) {
      return false
    }

    return parsePmwikiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePmwikiUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    const { origin } = new URL(url)
    // The table drops one trailing slash from a root, so a script path ending in one, as `/wiki/`,
    // keeps it.
    const root = `${origin}${parsed.scriptPath}/`

    if (parsed.kind === 'page') {
      return [
        pageFeeds.getFeedEntry('group-changes', { root, group: parsed.group }, 'rss'),
        pageFeeds.getFeedEntry('group-changes', { root, group: parsed.group }, 'atom'),
        pageFeeds.getFeedEntry('site-changes', { root }, 'rss'),
        pageFeeds.getFeedEntry('site-changes', { root }, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('site-changes', { root }, 'rss'),
      pageFeeds.getFeedEntry('site-changes', { root }, 'atom'),
    ]
  },
}
