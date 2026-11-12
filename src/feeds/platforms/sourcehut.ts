import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers log.
// Handler needed for: repo.

export type SourcehutUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string }

export const hosts = ['git.sr.ht']
const userHosts = ['sr.ht', 'todo.sr.ht', ...hosts]

const feeds = definePlatformFeeds([
  { key: 'sourcehut:commits', template: 'https://git.sr.ht/~{owner}/{repo}/log/rss.xml' },
  { key: 'sourcehut:commits', template: 'https://git.sr.ht/~{owner}/{repo}/log/{ref}/rss.xml' },
  { key: 'sourcehut:refs', template: 'https://git.sr.ht/~{owner}/{repo}/refs/rss.xml' },
])

export const parseSourcehutUrl = (url: string): SourcehutUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [ownerHandle, repo] = getPathSegments(parsedUrl)

  // length: keeps a bare ~ with no owner after it out
  if (!ownerHandle?.startsWith('~') || ownerHandle.length < 2) {
    return
  }

  const owner = ownerHandle.slice(1)

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
    const parsed = parseSourcehutUrl(url)

    if (parsed?.kind !== 'repo') {
      return []
    }

    const params = { owner: parsed.owner, repo: parsed.repo }

    return [
      feeds.getFeedEntry('sourcehut:commits', params),
      feeds.getFeedEntry('sourcehut:refs', params),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}
