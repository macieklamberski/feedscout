import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseGithubGistUrl } from '../../feeds/platforms/githubGist.js'

export const githubGistHandler: PlatformHandler = {
  match: (url) => {
    return parseGithubGistUrl(url) !== undefined
  },

  resolve: (url) => {
    const username = parseGithubGistUrl(url)?.username

    if (!username) {
      return []
    }

    return [{ uri: `https://github.com/${username}.png` }]
  },
}
