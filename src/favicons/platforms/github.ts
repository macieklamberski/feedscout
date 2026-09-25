import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseGithubUrl } from '../../feeds/platforms/github.js'

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return parseGithubUrl(url) !== undefined
  },

  resolve: (url) => {
    const owner = parseGithubUrl(url)?.owner

    if (!owner) {
      return []
    }

    return [{ uri: `https://github.com/${owner}.png` }]
  },
}
