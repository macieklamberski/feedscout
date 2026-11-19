import { ucoz } from 'feedintel'
import { getAnyOf, getPathSegments, isHostOrSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: forum, forum-section, publ.
// Handler needed for: news.

type UcozModule = (typeof modules)[number]

export type UcozUrl =
  | { kind: 'home' }
  | { kind: 'module'; module: UcozModule }
  | { kind: 'forumSection'; sectionId: string }

const domains = ucoz.hosts.tenants

// uCoz names its cookie `{cluster}{site}uCoz` after the site's system subdomain, custom domains
// too, where the cluster is a digit or, on narod.ru, a letter.
const cookieNameRegex = /^[\da-z][\w-]*uCoz$/
// A forum page is `/forum/{section}-{topic}-{page}`, and section 0 is the forum index.
const forumSectionRegex = /^([1-9]\d*)(?:-|$)/

const modules = ['blog', 'board', 'dir', 'forum', 'load', 'news', 'photo', 'publ', 'stuff'] as const

const feeds = withHintLabels(ucoz.feeds)

export const isUcozHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => cookieNameRegex.test(name))
}

export const parseUcozUrl = (url: string): UcozUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOrSubdomainOf(parsedUrl, domains) && !getTenantSubdomain(parsedUrl, domains)) {
    return
  }

  const [segment, subsegment] = getPathSegments(parsedUrl)
  const module = getAnyOf(segment, modules)

  if (module === 'forum') {
    const sectionId = subsegment?.match(forumSectionRegex)?.[1]

    if (sectionId) {
      return { kind: 'forumSection', sectionId }
    }
  }

  if (module) {
    return { kind: 'module', module }
  }

  return { kind: 'home' }
}

export const ucozHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (
      !getTenantSubdomain(url, domains) &&
      !hasMarker(content, headers, { headers: isUcozHeaders })
    ) {
      return false
    }

    return parseUcozUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseUcozUrl(url)

    if (!parsed) {
      return []
    }

    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    // Every site runs the news module, so every page builds its feed after its own feeds, and the
    // home page lists its news.
    if (parsed.kind === 'forumSection') {
      return [
        pageFeeds.getFeedEntry('forum-section', { sectionId: parsed.sectionId }),
        pageFeeds.getFeedEntry('forum'),
        pageFeeds.getFeedEntry('news'),
      ]
    }

    if (parsed.kind === 'module' && parsed.module !== 'news') {
      return [pageFeeds.getFeedEntry(parsed.module), pageFeeds.getFeedEntry('news')]
    }

    return [pageFeeds.getFeedEntry('news')]
  },

  getFeedHint: feeds.getFeedHint,
}
