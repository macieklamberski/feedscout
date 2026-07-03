import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

const gistRegex = /^\/([^/]+)\/([a-f0-9]+)/
const starredRegex = /^\/([^/]+)\/starred\/?$/
const forksRegex = /^\/([^/]+)\/forks\/?$/
const userRegex = /^\/([^/]+)\/?$/
const discoverRegex = /^\/discover\/?$/

export const hosts = ['gist.github.com']
export const excludedPaths = ['discover', 'search', 'login', 'join', 'settings']

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

    // Match /{username}/starred pattern (user's starred gists page).
    const starredMatch = pathname.match(starredRegex)

    if (starredMatch?.[1] && !isAnyOf(starredMatch[1], excludedPaths)) {
      const username = starredMatch[1]

      return [
        {
          uri: `https://gist.github.com/${username}/starred.atom`,
          hint: composeHint('github-gist:starred'),
        },
      ]
    }

    // Match /{username}/forks pattern (user's forked gists page).
    const forksMatch = pathname.match(forksRegex)

    if (forksMatch?.[1] && !isAnyOf(forksMatch[1], excludedPaths)) {
      const username = forksMatch[1]

      return [
        {
          uri: `https://gist.github.com/${username}/forks.atom`,
          hint: composeHint('github-gist:forks'),
        },
      ]
    }

    // Match /{username}/{gist-id} pattern (specific gist).
    const gistMatch = pathname.match(gistRegex)

    if (gistMatch?.[1] && gistMatch?.[2]) {
      const username = gistMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [
          {
            uri: `https://gist.github.com/${username}.atom`,
            hint: composeHint('github-gist:gists'),
          },
        ]
      }

      return []
    }

    // Match /{username} pattern (user's gists page).
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1] && !isAnyOf(userMatch[1], excludedPaths)) {
      const username = userMatch[1]

      return [
        {
          uri: `https://gist.github.com/${username}.atom`,
          hint: composeHint('github-gist:gists'),
        },
      ]
    }

    return []
  },
}
