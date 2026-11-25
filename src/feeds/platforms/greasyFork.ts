import { greasyFork } from 'feedintel'
import { resolveUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findDescendant, findElement, hasClass } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: new, updated, user.

export type GreasyForkUrl =
  | { kind: 'user'; locale?: string; userId: string }
  | { kind: 'script'; locale?: string }
  | { kind: 'home'; locale?: string }
export type GreasyForkPage =
  | { kind: 'user'; locale?: string; userId: string }
  | { kind: 'home'; locale?: string }

const feeds = withHintLabels(greasyFork.feeds)

export const parseGreasyForkUrl = (url: string): GreasyForkUrl | undefined => {
  const page = greasyFork.pages.readUrl(url)

  if (!page) {
    return
  }

  const { locale } = page.values

  if (page.key === 'user') {
    return { kind: 'user', locale, userId: page.values.userId }
  }

  return { kind: page.key, locale }
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
  const authorPage = greasyFork.pages.readUrl(resolveUrl(authorLink?.attribs.href ?? '', url) ?? '')

  if (authorPage?.key !== 'user') {
    return
  }

  return { kind: 'user', locale: parsed.locale, userId: authorPage.values.userId }
}

export const greasyForkHandler: PlatformHandler = {
  match: (url) => {
    return parseGreasyForkUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getGreasyForkPage(url, content)
    const pageFeeds = feeds.forSite(url)

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
