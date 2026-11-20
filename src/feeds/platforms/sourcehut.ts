import { sourcehut } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: commits, refs.

export type SourcehutUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string }
  | { kind: 'project'; owner: string; project: string }

export const hosts = sourcehut.hosts.exact
const projectHosts = ['sr.ht']
const userHosts = [...projectHosts, 'todo.sr.ht', ...hosts]

const feeds = withHintLabels(sourcehut.feeds)

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

  if (repo && isHostOf(parsedUrl, projectHosts)) {
    return { kind: 'project', owner, project: repo }
  }

  if (!repo && isHostOf(parsedUrl, userHosts)) {
    return { kind: 'user', owner }
  }
}

export const sourcehutHandler: PlatformHandler = {
  match: (url) => {
    const kind = parseSourcehutUrl(url)?.kind

    return isAnyOf(kind, ['repo', 'project'])
  },

  resolve: (url) => {
    const parsed = parseSourcehutUrl(url)

    if (parsed?.kind === 'project') {
      return [feeds.getFeedEntry('project', { owner: parsed.owner, project: parsed.project })]
    }

    if (parsed?.kind !== 'repo') {
      return []
    }

    const params = { owner: parsed.owner, repo: parsed.repo }

    return [feeds.getFeedEntry('commits', params), feeds.getFeedEntry('refs', params)]
  },

  getFeedHint: feeds.getFeedHint,
}
