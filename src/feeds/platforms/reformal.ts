import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ReformalUrl = { kind: 'project'; project: string; domain: string }

const domains = ['reformal.ru', 'idea.informer.com']

// A project serves the same feed with an `ia` idea id in the query, which the table reads as an
// extra parameter.
const feeds = definePlatformFeeds(
  [{ key: 'reformal:feedback', template: '{scheme}://{project}.{domain}/proj/rss' }],
  { domains },
)

export const parseReformalUrl = (url: string): ReformalUrl | undefined => {
  for (const domain of domains) {
    const project = getTenantSubdomain(url, [domain])

    if (project) {
      return { kind: 'project', project, domain }
    }
  }
}

export const reformalHandler: PlatformHandler = {
  match: (url) => {
    return parseReformalUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseReformalUrl(url)

    if (!parsed) {
      return []
    }

    const scheme = new URL(url).protocol.slice(0, -1)
    const params = { scheme, project: parsed.project, domain: parsed.domain }

    return [feeds.getFeedEntry('reformal:feedback', params)]
  },

  getFeedHint: feeds.getFeedHint,
}
