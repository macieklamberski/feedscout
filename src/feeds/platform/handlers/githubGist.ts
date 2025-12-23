import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

const hosts = ['gist.github.com']
const excludedPaths = ['discover', 'search', 'login', 'join', 'settings']

export const githubGistHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const uris: Array<string> = []

    // Match /{username}/{gist-id} pattern (specific gist).
    const gistMatch = pathname.match(/^\/([^/]+)\/([a-f0-9]+)/)

    if (gistMatch?.[1] && gistMatch?.[2]) {
      const username = gistMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        uris.push(`https://gist.github.com/${username}.atom`)
      }

      return uris
    }

    // Match /{username}/starred pattern (user's starred gists page).
    const starredMatch = pathname.match(/^\/([^/]+)\/starred\/?$/)

    if (starredMatch?.[1] && !isAnyOf(starredMatch[1], excludedPaths)) {
      const username = starredMatch[1]

      uris.push(`https://gist.github.com/${username}/starred.atom`)

      return uris
    }

    // Match /{username} pattern (user's gists page).
    const userMatch = pathname.match(/^\/([^/]+)\/?$/)

    if (userMatch?.[1] && !isAnyOf(userMatch[1], excludedPaths)) {
      const username = userMatch[1]

      uris.push(`https://gist.github.com/${username}.atom`)

      return uris
    }

    return []
  },
}
