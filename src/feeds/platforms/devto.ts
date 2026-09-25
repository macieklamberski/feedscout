import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, profile (guess, html), partly covers latest.
// Handler needed for: article, tag.

export type DevtoUrl = { kind: 'profile'; owner: string } | { kind: 'tag'; tag: string }

const hosts = ['dev.to', 'www.dev.to']
// An article lives under its author's name, a user or an organization: /{name}/{slug}.
const ownerRegex = /^\/([a-zA-Z0-9_-]+)(?:\/|$)/
const tagRegex = /^\/t\/([^/]+)/
// See: https://github.com/forem/forem/blob/main/config/routes.rb.
const excludedPaths = [
  'tag',
  'tags',
  'search',
  'top',
  'latest',
  'about',
  'contact',
  'privacy',
  'terms',
  'code-of-conduct',
  'faq',
  'enter',
  'settings',
  'signout_confirm',
  'notifications',
  'reading-list',
  'dashboard',
  // Top-level routes that answer 404 from both the users and the organizations API.
  't',
  'api',
  'new',
  'videos',
  'podcasts',
  'pod',
  'listings',
  'challenges',
  'series',
  'readinglist',
  'connect',
  'community-moderation',
  'badges',
  'events',
  'stories',
  'users',
  'organizations',
  // Top-level routes Forem matches before a user or organization name.
  'a',
  'admin',
  'bb',
  'billboards',
  'calendar',
  'challenge',
  'checkin',
  'community',
  'confirm-email',
  'credits',
  'curated',
  'curation',
  'discover',
  'embed',
  'feed',
  'following',
  'internal',
  'latest_less_filtered',
  'leaderboard',
  'leadership',
  'locale',
  'magic_links',
  'manage',
  'menu',
  'mod',
  'onboarding',
  'p',
  'page',
  'r',
  'report-abuse',
  'rss',
  'security',
  'survey',
  'tag-moderation',
  'trending',
  'trends',
  'welcome',
]

const homePaths = ['/', '']
const latestPaths = ['/latest', '/latest/']

export const parseDevtoUrl = (url: string): DevtoUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const tag = parsedUrl.pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const owner = parsedUrl.pathname.match(ownerRegex)?.[1]

  if (!owner || isAnyOf(owner, excludedPaths)) {
    return
  }

  // DEV redirects a name in any case to the lowercase one its feed and APIs answer under.
  return { kind: 'profile', owner: owner.toLowerCase() }
}

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Homepage: global community feed.
    if (homePaths.includes(pathname)) {
      return [{ uri: 'https://dev.to/feed', hint: composeHint('devto:community') }]
    }

    // Latest sort: /latest.
    if (latestPaths.includes(pathname)) {
      return [
        { uri: 'https://dev.to/feed/latest', hint: composeHint('devto:latest') },
        { uri: 'https://dev.to/feed', hint: composeHint('devto:community') },
      ]
    }

    const parsed = parseDevtoUrl(url)

    if (parsed?.kind === 'profile') {
      return [{ uri: `https://dev.to/feed/${parsed.owner}`, hint: composeHint('devto:posts') }]
    }

    if (parsed?.kind === 'tag') {
      return [{ uri: `https://dev.to/feed/tag/${parsed.tag}`, hint: composeHint('devto:tag') }]
    }

    return []
  },
}
