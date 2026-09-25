import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers starred, user (html).
// Handler needed for: discover, forks.

export type GithubGistUrl =
  | { kind: 'user'; username: string }
  | { kind: 'starred'; username: string }
  | { kind: 'forks'; username: string }

const discoverRegex = /^\/discover\/?$/

const hosts = ['gist.github.com']
const excludedPaths = ['discover', 'search', 'login', 'join', 'settings']
const forksSections = ['forks', 'forked']
const feedSuffixRegex = /\.atom$/

// A gist page, /{username}/{gist-id}, and the /public and /secret listings belong to the
// user's gists.
export const parseGithubGistUrl = (url: string): GithubGistUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [first, second, ...rest] = getPathSegments(url)
  // GitHub names carry no dots, so a dot starts a route suffix such as .atom.
  const username = first?.split('.')[0]
  // The starred and forked feed URLs, such as /{username}/starred.atom, name their page too.
  const section = second?.replace(feedSuffixRegex, '')

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  if (section === 'starred' && rest.length === 0) {
    return { kind: 'starred', username }
  }

  if (section && forksSections.includes(section) && rest.length === 0) {
    return { kind: 'forks', username }
  }

  return { kind: 'user', username }
}

export const githubGistHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Discover page: /discover (global new gists feed).
    if (discoverRegex.test(pathname)) {
      return [
        {
          uri: 'https://gist.github.com/discover.atom',
          hint: composeHint('github-gist:discover'),
        },
      ]
    }

    const parsed = parseGithubGistUrl(url)

    if (parsed?.kind === 'starred') {
      return [
        {
          uri: `https://gist.github.com/${parsed.username}/starred.atom`,
          hint: composeHint('github-gist:starred'),
        },
      ]
    }

    // GitHub serves `/{username}/forks.atom` as the user's own gists, and the forked
    // gists only at `/{username}/forked.atom`.
    if (parsed?.kind === 'forks') {
      return [
        {
          uri: `https://gist.github.com/${parsed.username}/forked.atom`,
          hint: composeHint('github-gist:forks'),
        },
      ]
    }

    if (parsed?.kind === 'user') {
      return [
        {
          uri: `https://gist.github.com/${parsed.username}.atom`,
          hint: composeHint('github-gist:gists'),
        },
      ]
    }

    return []
  },
}
