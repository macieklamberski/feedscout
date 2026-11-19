import { greasyFork } from 'feedintel'
import { getPathSegments, isHostOf, isLocale, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findDescendant, findElement, getNumericId, hasClass } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: new, updated, user.

export type GreasyForkUrl =
  | { kind: 'user'; locale: string; userId: string }
  | { kind: 'script'; locale: string }
  | { kind: 'home'; locale: string }
export type GreasyForkPage =
  | { kind: 'user'; locale: string; userId: string }
  | { kind: 'home'; locale: string }

const hosts = greasyFork.hosts.exact

const userRegex = /^\/users\/([^/]+)/i
const scriptRegex = /^\/scripts\/\d/i
// A user segment is `{id}-{name}`, and the name is optional.
const userIdRegex = /^(?<id>[^-]+)/
const authorHrefRegex = /\/users\/(?<id>[^/-]+)/i

const feeds = withHintLabels(greasyFork.feeds)

export const parseGreasyForkUrl = (url: string): GreasyForkUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [localeOrRoute] = getPathSegments(parsedUrl)
  const hasLocale = localeOrRoute !== undefined && isLocale(localeOrRoute)
  // A page without a locale redirects to one by the browser language.
  const locale = hasLocale ? localeOrRoute : 'en'
  const path = hasLocale ? parsedUrl.pathname.slice(localeOrRoute.length + 1) : parsedUrl.pathname
  const userId = getNumericId(path.match(userRegex)?.[1], userIdRegex)

  if (userId) {
    return { kind: 'user', locale, userId }
  }

  if (scriptRegex.test(path)) {
    return { kind: 'script', locale }
  }

  return { kind: 'home', locale }
}

// The script page names its author only in its content, and the feedback, code and version
// pages of a script name no author at all.
export const getGreasyForkPage = (
  url: string,
  content: string | undefined,
): GreasyForkPage | undefined => {
  const parsed = parseGreasyForkUrl(url)

  if (parsed?.kind !== 'script') {
    return parsed
  }

  const author = findElement(content, (element) => {
    return element.name === 'dd' && hasClass(element, 'script-show-author')
  })
  const authorLink = author && findDescendant(author, (element) => element.name === 'a')
  const userId = getNumericId(authorLink?.attribs.href, authorHrefRegex)

  if (!userId) {
    return
  }

  return { kind: 'user', locale: parsed.locale, userId }
}

export const greasyForkHandler: PlatformHandler = {
  match: (url) => {
    return parseGreasyForkUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getGreasyForkPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const params = { scheme: 'https', host: `api.${new URL(url).hostname}`, locale: page.locale }

    if (page.kind === 'user') {
      return [pageFeeds.getFeedEntry('user', { ...params, userId: page.userId })]
    }

    return [pageFeeds.getFeedEntry('new', params), pageFeeds.getFeedEntry('updated', params)]
  },

  getFeedHint: feeds.getFeedHint,
}
