import { lobsters } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: domain, stories, tag, top.
// Handler needed for: comments, newest.

export type LobstersUrl =
  | { kind: 'tag'; tags: string }
  | { kind: 'domain'; domain: string }
  | { kind: 'user'; username: string }
  | { kind: 'top'; period?: string }
  | { kind: 'newest' }
  | { kind: 'comments' }
  | { kind: 'home' }

const hosts = lobsters.hosts.exact

const tagRegex = /^\/t\/(?<tags>[^/]+)/i
const domainRegex = /^\/domains\/([^/]+)/i
const userRegex = /^\/~(?<username>[^/]+)/
const topRegex = /^\/top(?:\/(?<period>\d+[dwmy]))?\/?$/i
const newestRegex = /^\/newest\/?$/i
const commentsRegex = /^\/comments\/?$/i
const tagsValueRegex = /^[\w,-]+$/

const feeds = withHintLabels(lobsters.feeds)

export const parseLobstersUrl = (url: string): LobstersUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  // A comma joins several tags: /t/{tag1},{tag2}.
  const tags = pathname.match(tagRegex)?.groups?.tags

  if (tags && tagsValueRegex.test(tags)) {
    return { kind: 'tag', tags }
  }

  const domain = pathname.match(domainRegex)?.[1]

  if (domain) {
    return { kind: 'domain', domain }
  }

  const username = pathname.match(userRegex)?.groups?.username

  if (username && wordOrHyphenRegex.test(username)) {
    return { kind: 'user', username }
  }

  const topMatch = pathname.match(topRegex)

  // Top page, for a period or without one: /top/{period} or /top.
  if (topMatch) {
    return { kind: 'top', period: topMatch.groups?.period }
  }

  if (newestRegex.test(pathname)) {
    return { kind: 'newest' }
  }

  if (commentsRegex.test(pathname)) {
    return { kind: 'comments' }
  }

  return { kind: 'home' }
}

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return parseLobstersUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLobstersUrl(url)

    if (!parsed) {
      return []
    }

    // The site-wide stories, newest and comments feeds need no value from the page, so every page
    // builds them after its own feeds.
    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tags: parsed.tags }),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('comments'),
      ]
    }

    if (parsed.kind === 'domain') {
      return [
        feeds.getFeedEntry('domain', { domain: parsed.domain }),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('comments'),
      ]
    }

    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('user-stories', { username: parsed.username }),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('comments'),
      ]
    }

    // The top page without a period redirects to the one-week page.
    if (parsed.kind === 'top') {
      return [
        feeds.getFeedEntry('top', { period: parsed.period ?? '1w' }),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('comments'),
      ]
    }

    if (parsed.kind === 'newest') {
      return [
        feeds.getFeedEntry('newest'),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('comments'),
      ]
    }

    if (parsed.kind === 'comments') {
      return [
        feeds.getFeedEntry('comments'),
        feeds.getFeedEntry('stories'),
        feeds.getFeedEntry('newest'),
      ]
    }

    return [
      feeds.getFeedEntry('stories'),
      feeds.getFeedEntry('newest'),
      feeds.getFeedEntry('comments'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
