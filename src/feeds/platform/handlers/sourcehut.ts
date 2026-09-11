import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Sourcehut repository pages carry no `alternate` link. Commit and ref feeds
// live at `/~{user}/{repo}/log/rss.xml` and `/~{user}/{repo}/refs/rss.xml`.
//
// The commit feed's own `<link>` holds a Python bytes repr,
// `.../log/b'master'`, so the branch can never be read back out of it.

const hosts = ['git.sr.ht']

const getRepoPath = (url: string): string | undefined => {
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
    try {
      const { origin } = new URL(url)
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
    } catch {}

    return []
  },
}
