import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers log.
// Handler needed for: repo.

export type SourcehutUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string }

export const hosts = ['git.sr.ht']
const userHosts = ['sr.ht', 'todo.sr.ht', ...hosts]

export const parseSourcehutUrl = (url: string): SourcehutUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [first, repo] = getPathSegments(parsedUrl)

  if (!first?.startsWith('~') || first.length < 2) {
    return
  }

  const owner = first.slice(1)

  if (repo && isHostOf(parsedUrl, hosts)) {
    return { kind: 'repo', owner, repo }
  }

  if (!repo && isHostOf(parsedUrl, userHosts)) {
    return { kind: 'user', owner }
  }
}

export const sourcehutHandler: PlatformHandler = {
  match: (url) => {
    return parseSourcehutUrl(url)?.kind === 'repo'
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseSourcehutUrl(url)

    if (parsed?.kind !== 'repo') {
      return []
    }

    return [
      {
        uri: `${origin}/~${parsed.owner}/${parsed.repo}/log/rss.xml`,
        hint: composeHint('sourcehut:commits'),
      },
      {
        uri: `${origin}/~${parsed.owner}/${parsed.repo}/refs/rss.xml`,
        hint: composeHint('sourcehut:refs'),
      },
    ]
  },
}
