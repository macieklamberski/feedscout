import { sourcehut } from 'feedintel'
import { isAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: commits, refs.

export type SourcehutUrl =
  | { kind: 'user'; owner: string }
  | { kind: 'repo'; owner: string; repo: string }
  | { kind: 'project'; owner: string; project: string }

const feeds = withHintLabels(sourcehut.feeds)

export const parseSourcehutUrl = (url: string): SourcehutUrl | undefined => {
  const page = sourcehut.pages.read(url)

  if (!page) {
    return
  }

  const { owner, repo, project } = page.params

  if (page.key === 'repo') {
    return { kind: 'repo', owner, repo }
  }

  if (page.key === 'project') {
    return { kind: 'project', owner, project }
  }

  return { kind: 'user', owner }
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
