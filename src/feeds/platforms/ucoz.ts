import { ucoz } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: forum, forum-section, publ.
// Handler needed for: news.

type UcozPageKey = NonNullable<ReturnType<typeof ucoz.pages.read>>['key']

type UcozModule = Exclude<UcozPageKey, 'site' | 'platform' | 'forum-section' | 'home'>

export type UcozUrl =
  | { kind: 'home' }
  | { kind: 'module'; module: UcozModule }
  | { kind: 'forumSection'; sectionId: string }

// uCoz names its cookie `{cluster}{site}uCoz` after the site's system subdomain, custom domains
// too, where the cluster is a digit or, on narod.ru, a letter.
const cookieNameRegex = /^[\da-z][\w-]*uCoz$/

const feeds = withHintLabels(ucoz.feeds)

export const isUcozHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => cookieNameRegex.test(name))
}

export const parseUcozUrl = (url: string): UcozUrl | undefined => {
  if (!URL.canParse(url) || ucoz.pages.read(url)?.key === 'platform') {
    return
  }

  const page = ucoz.pages.read(url, { root: new URL(url).origin })

  if (!page || page.key === 'home' || page.key === 'site' || page.key === 'platform') {
    return { kind: 'home' }
  }

  if (page.key === 'forum-section') {
    return { kind: 'forumSection', sectionId: page.params.sectionId }
  }

  return { kind: 'module', module: page.key }
}

export const ucozHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (
      ucoz.pages.read(url)?.key !== 'site' &&
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
