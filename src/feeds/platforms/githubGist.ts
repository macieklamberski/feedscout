import { githubGist } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: gists, starred.
// Handler needed for: discover, forks.

export type GithubGistUrl =
  | { kind: 'user'; username: string }
  | { kind: 'starred'; username: string }
  | { kind: 'forks'; username: string }
  | { kind: 'discover' }

const hosts = githubGist.hosts.exact

const discoverRegex = /^\/discover(?:\.atom)?\/?$/i
const feedSuffixRegex = /\.atom$/i

const forksSections = ['forks', 'forked']

const feeds = withHintLabels(githubGist.feeds)

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

    // The discover feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'discover') {
      return [feeds.getFeedEntry('discover')]
    }

    if (parsed.kind === 'starred') {
      return [
        feeds.getFeedEntry('starred', { username: parsed.username }),
        feeds.getFeedEntry('discover'),
      ]
    }

    if (parsed.kind === 'forks') {
      return [
        feeds.getFeedEntry('forks', { username: parsed.username }),
        feeds.getFeedEntry('discover'),
      ]
    }

    return [
      feeds.getFeedEntry('gists', { username: parsed.username }),
      feeds.getFeedEntry('discover'),
    ]
  },

  getFeedHint: (url) => {
    const [name, section] = getPathSegments(url)
    const username = section ? name : name?.replace(feedSuffixRegex, '')

    // GitHub names carry no dots, and /discover is the site's page, so /discover/starred.atom
    // names no user.
    if (!username || username.includes('.') || (section && isAnyOf(username, 'discover'))) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
