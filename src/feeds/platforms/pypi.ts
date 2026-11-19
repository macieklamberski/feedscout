import { pypi } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PypiUrl = { kind: 'project'; project: string } | { kind: 'home' }

const hosts = pypi.hosts.exact

const projectRegex = /^\/project\/([\w.-]+)(?:\/|$)/i

const feeds = withHintLabels(pypi.feeds)

export const parsePypiUrl = (url: string): PypiUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const project = pathname.match(projectRegex)?.[1]

  if (project) {
    return { kind: 'project', project }
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
