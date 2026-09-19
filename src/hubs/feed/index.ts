import { parseFeed } from 'feedsmith'
import type { Atom, DeepPartial } from 'feedsmith/types'
import { attempt } from '../../common/discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverResolveUrlFn } from '../../common/types.js'
import type { HubResult } from '../discover/types.js'

const getLinksWithRel = (
  links: Array<DeepPartial<Atom.Link<string>>> | undefined,
  rel: string,
): Array<string> => {
  return (
    links?.filter((link) => link.rel === rel && link.href).map((link) => link.href as string) ?? []
  )
}

export const discoverHubsFromFeed = (
  content: string,
  baseUrl: string,
  resolveUrlFn: DiscoverResolveUrlFn,
  onError?: DiscoverOnErrorFn,
): Array<HubResult> => {
  try {
    const { format, feed } = parseFeed(content)

    // JSON Feed has native hubs support.
    if (format === 'json') {
      const hubs = feed.hubs ?? []
      const feedUrl = feed.feed_url
      const topic = feedUrl
        ? attempt(() => resolveUrlFn(feedUrl, baseUrl), feedUrl, 'resolveUrlFn', onError)
        : baseUrl

      return hubs
        .filter((hub) => hub.url)
        .map((hub) => ({
          hub: attempt(
            () => resolveUrlFn(hub.url as string, baseUrl),
            hub.url as string,
            'resolveUrlFn',
            onError,
          ),
          topic,
        }))
    }

    // Get links array based on format.
    const links = format === 'atom' ? feed.links : feed.atom?.links
    const hubUris = getLinksWithRel(links, 'hub')

    if (hubUris.length > 0) {
      const selfUris = getLinksWithRel(links, 'self')
      const topic = selfUris[0]
        ? attempt(() => resolveUrlFn(selfUris[0], baseUrl), selfUris[0], 'resolveUrlFn', onError)
        : baseUrl

      return hubUris.map((hub) => ({
        hub: attempt(() => resolveUrlFn(hub, baseUrl), hub, 'resolveUrlFn', onError),
        topic,
      }))
    }
  } catch {
    // Silently fail - content is not a valid feed.
  }

  return []
}
