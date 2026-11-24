import { pypi } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PypiUrl = { kind: 'project'; project: string } | { kind: 'home' }

const feeds = withHintLabels(pypi.feeds)

export const parsePypiUrl = (url: string): PypiUrl | undefined => {
  const page = pypi.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'project') {
    return { kind: 'project', project: page.params.project }
  }

  return { kind: 'home' }
}

export const pypiHandler: PlatformHandler = {
  match: (url) => {
    return parsePypiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePypiUrl(url)

    if (!parsed) {
      return []
    }

    // Every page links the two site-wide feeds. The feed path answers for any case and any of
    // `-`, `_` and `.` in the project name.
    if (parsed.kind === 'project') {
      return [
        feeds.getFeedEntry('releases', { project: parsed.project }),
        feeds.getFeedEntry('new-packages'),
        feeds.getFeedEntry('updates'),
      ]
    }

    return [feeds.getFeedEntry('new-packages'), feeds.getFeedEntry('updates')]
  },

  getFeedHint: feeds.getFeedHint,
}
