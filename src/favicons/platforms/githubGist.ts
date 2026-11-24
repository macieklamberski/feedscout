import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

export type GithubGistUrl =
  | { kind: 'user'; username: string }
  | { kind: 'starred'; username: string }
  | { kind: 'forks'; username: string }
  | { kind: 'discover' }

const hosts = ['gist.github.com']

const discoverRegex = /^\/discover(?:\.atom)?\/?$/i
const feedSuffixRegex = /\.atom$/i

const forksSections = ['forks', 'forked']

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
    const kind = parseGithubGistUrl(url)?.kind

    return kind !== undefined && kind !== 'discover'
  },

  resolve: (url) => {
    const parsed = parseGithubGistUrl(url)

    if (!parsed || parsed.kind === 'discover') {
      return []
    }

    return [{ uri: `https://github.com/${parsed.username}.png` }]
  },
}
