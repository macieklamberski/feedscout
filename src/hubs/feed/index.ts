import type { Atom } from 'feedsmith'
import { parseFeed } from 'feedsmith'
import { defaultResolveUrlFn } from '../../common/discover/defaults.js'
import { resolveUrl } from '../../common/discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverResolveUrlFn } from '../../common/types.js'
import type { HubResult } from '../discover/types.js'

const getLinksWithRel = (
  links: Array<Atom.Link<string>> | undefined,
  rel: string,
): Array<string> => {
  return (
    links?.filter((link) => link.rel === rel && link.href).map((link) => link.href as string) ?? []
  )
}

export const discoverHubsFromFeed = (
  content: string,
  baseUrl: string,
  resolveUrlFn: DiscoverResolveUrlFn = defaultResolveUrlFn,
  onError?: DiscoverOnErrorFn,
): Array<HubResult> => {
  try {
    const { format, feed } = parseFeed(content)

    // JSON Feed has native hubs support.
    if (format === 'json') {
      const hubs = feed.hubs ?? []
      const topic = feed.feed_url
        ? resolveUrl(resolveUrlFn, feed.feed_url, baseUrl, onError)
        : baseUrl

      return hubs
        .filter((hub) => hub.url)
        .map((hub) => ({
          hub: resolveUrl(resolveUrlFn, hub.url as string, baseUrl, onError),
          topic,
        }))
    }

    // Get links array based on format.
    const links = format === 'atom' ? feed.links : feed.atom?.links
    const hubUris = getLinksWithRel(links, 'hub')

    if (hubUris.length > 0) {
      const selfUris = getLinksWithRel(links, 'self')
      const topic = selfUris[0] ? resolveUrl(resolveUrlFn, selfUris[0], baseUrl, onError) : baseUrl

      return hubUris.map((hub) => ({
        hub: resolveUrl(resolveUrlFn, hub, baseUrl, onError),
        topic,
      }))
    }
  } catch {
    // Silently fail - content is not a valid feed.
  }

  return []
}
