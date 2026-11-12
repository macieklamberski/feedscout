import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers gist, publicGists, starred, user (guess, html).
// Handler needed for: discover, forks.

export type GithubGistUrl =
  | { kind: 'user'; username: string }
  | { kind: 'starred'; username: string }
  | { kind: 'forks'; username: string }
  | { kind: 'discover' }

const hosts = ['gist.github.com']

const discoverRegex = /^\/discover(?:\.atom)?\/?$/i
const feedSuffixRegex = /\.atom$/i

const forksSections = ['forks', 'forked']

// GitHub serves `/{username}/forks.atom` as the user's own gists, and the forked gists only at
// `/{username}/forked.atom`.
const feeds = definePlatformFeeds([
  { key: 'github-gist:discover', template: 'https://gist.github.com/discover.atom' },
  { key: 'github-gist:starred', template: 'https://gist.github.com/{username}/starred.atom' },
  { key: 'github-gist:forks', template: 'https://gist.github.com/{username}/forked.atom' },
  { key: 'github-gist:gists', template: 'https://gist.github.com/{username}.atom' },
  { key: 'github-gist:gists', template: 'https://gist.github.com/{username}/forks.atom' },
])

// A gist page, /{username}/{gist-id}, and the /public and /secret listings belong to the
// user's gists.
export const parseGithubGistUrl = (url: string): GithubGistUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  // Discover page: /discover (global new gists feed).
  if (discoverRegex.test(new URL(url).pathname)) {
    return { kind: 'discover' }
  }

  const [name, section, ...rest] = getPathSegments(url)
  // The favicon handler reads a user feed URL, /{username}.atom, as the user.
  const username = section ? name : name?.replace(feedSuffixRegex, '')

  // GitHub names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  if (isAnyOf(section, 'starred') && rest.length === 0) {
    return { kind: 'starred', username }
  }

  if (isAnyOf(section, forksSections) && rest.length === 0) {
    return { kind: 'forks', username }
  }

  return { kind: 'user', username }
}

export const githubGistHandler: PlatformHandler = {
  match: (url) => {
    return parseGithubGistUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGithubGistUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'discover') {
      return [feeds.getFeedEntry('github-gist:discover')]
    }

    if (parsed.kind === 'starred') {
      return [feeds.getFeedEntry('github-gist:starred', { username: parsed.username })]
    }

    if (parsed.kind === 'forks') {
      return [feeds.getFeedEntry('github-gist:forks', { username: parsed.username })]
    }

    return [feeds.getFeedEntry('github-gist:gists', { username: parsed.username })]
  },

  getFeedKey: (url) => {
    const [name, section] = getPathSegments(url)
    const username = section ? name : name?.replace(feedSuffixRegex, '')

    // GitHub names carry no dots, and /discover is the site's page, so /discover/starred.atom
    // names no user.
    if (!username || username.includes('.') || (section && isAnyOf(username, 'discover'))) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
