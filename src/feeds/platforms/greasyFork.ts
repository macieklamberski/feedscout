import { composeQuery, getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findDescendant,
  findElement,
  getNumericId,
  hasClass,
  letterGroupsRegex,
} from '../../common/utils.js'

// Discoverability: Unmeasured.

export type GreasyForkUrl =
  | { kind: 'user'; locale: string; userId: string }
  | { kind: 'script'; locale: string }
  | { kind: 'home'; locale: string }
export type GreasyForkPage =
  | { kind: 'user'; locale: string; userId: string }
  | { kind: 'home'; locale: string }

const hosts = ['greasyfork.org']
const apiOrigin = 'https://api.greasyfork.org'

const userRegex = /^\/users\/([^/]+)/i
const scriptRegex = /^\/scripts\/\d/i
// A user segment is `{id}-{name}`, and the name is optional.
const userIdRegex = /^(?<id>[^-]+)/
const authorHrefRegex = /\/users\/(?<id>[^/-]+)/i

export const parseGreasyForkUrl = (url: string): GreasyForkUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [first] = getPathSegments(parsedUrl)
  const hasLocale = first !== undefined && letterGroupsRegex.test(first)
  // A page without a locale redirects to one by the browser language.
  const locale = hasLocale ? first : 'en'
  const path = hasLocale ? parsedUrl.pathname.slice(first.length + 1) : parsedUrl.pathname
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

    if (!page) {
      return []
    }

    // The feeds answer 406 without a locale in the path.
    const base = `${apiOrigin}/${page.locale}/scripts.atom`

    if (page.kind === 'user') {
      // The feed lists only the scripts in the locale's language unless `filter_locale=0` is set,
      // while the user page lists them all.
      const query = composeQuery({ by: page.userId, filter_locale: '0' })

      return [{ uri: `${base}${query}`, hint: composeHint('greasy-fork:user') }]
    }

    return [
      { uri: `${base}?sort=created`, hint: composeHint('greasy-fork:new') },
      { uri: `${base}?sort=updated`, hint: composeHint('greasy-fork:updated') },
    ]
  },
}
