import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseGithubUrl } from '../../feeds/platforms/github.js'

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return parseGithubUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGithubUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'discussions') {
      return [{ uri: `https://github.com/${parsed.org}.png` }]
    }

    return [{ uri: `https://github.com/${parsed.owner}.png` }]
  },
}
