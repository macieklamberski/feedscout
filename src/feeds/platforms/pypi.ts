import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, project (html).
// Handler needed for: version.

export type PypiUrl = { kind: 'project'; project: string } | { kind: 'home' }

const hosts = ['pypi.org', 'www.pypi.org']

const projectRegex = /^\/project\/([\w.-]+)(?:\/|$)/i

const feeds = definePlatformFeeds([
  { key: 'pypi:releases', template: 'https://pypi.org/rss/project/{project}/releases.xml' },
  { key: 'pypi:new-packages', template: 'https://pypi.org/rss/packages.xml' },
  { key: 'pypi:updates', template: 'https://pypi.org/rss/updates.xml' },
])

// Every page links the two site-wide feeds.
const siteFeeds = [feeds.getFeedEntry('pypi:new-packages'), feeds.getFeedEntry('pypi:updates')]

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

    // The feed path answers for any case and any of `-`, `_` and `.` in the project name.
    if (parsed.kind === 'project') {
      return [feeds.getFeedEntry('pypi:releases', { project: parsed.project }), ...siteFeeds]
    }

    return siteFeeds
  },

  getFeedHint: feeds.getFeedHint,
}
