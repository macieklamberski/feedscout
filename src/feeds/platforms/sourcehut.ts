import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers log.
// Handler needed for: repo.

export const hosts = ['git.sr.ht']

export const getRepoPath = (url: string): string | undefined => {
  const segments = new URL(url).pathname.split('/').filter(Boolean)

  if (!segments[0]?.startsWith('~') || segments[0].length < 2 || !segments[1]) {
    return
  }

  return `${segments[0]}/${segments[1]}`
}

export const sourcehutHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && Boolean(getRepoPath(url))
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin } = parsedUrl
    const repoPath = getRepoPath(url)

    if (!repoPath) {
      return []
    }

    return [
      {
        uri: `${origin}/${repoPath}/log/rss.xml`,
        hint: composeHint('sourcehut:commits'),
      },
      {
        uri: `${origin}/${repoPath}/refs/rss.xml`,
        hint: composeHint('sourcehut:refs'),
      },
    ]
  },
}
