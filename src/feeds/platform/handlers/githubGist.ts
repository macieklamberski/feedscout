import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

const gistPattern = /^\/([^/]+)\/([a-f0-9]+)/
const starredPattern = /^\/([^/]+)\/starred\/?$/
const userPattern = /^\/([^/]+)\/?$/

export const hosts = ['gist.github.com']
export const excludedPaths = ['discover', 'search', 'login', 'join', 'settings']

export const githubGistHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Match /{username}/{gist-id} pattern (specific gist).
    const gistMatch = pathname.match(gistPattern)

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

    // Match /{username}/starred pattern (user's starred gists page).
    const starredMatch = pathname.match(starredPattern)

    if (starredMatch?.[1] && !isAnyOf(starredMatch[1], excludedPaths)) {
      const username = starredMatch[1]

      return [
        {
          uri: `https://gist.github.com/${username}/starred.atom`,
          hint: composeHint('github-gist:starred'),
        },
      ]
    }

    // Match /{username} pattern (user's gists page).
    const userMatch = pathname.match(userPattern)

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
