import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseGithubGistUrl } from '../../feeds/platforms/githubGist.js'

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
