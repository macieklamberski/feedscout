import { parseFeed } from 'feedsmith'
import type { Atom, DeepPartial } from 'feedsmith/types'
import type { HubResult } from '../discover/types.js'

const getLinksWithRel = (
  links: Array<DeepPartial<Atom.Link<string>>> | undefined,
  rel: string,
): Array<string> => {
  return (
    links?.filter((link) => link.rel === rel && link.href).map((link) => link.href as string) ?? []
  )
}

export const discoverHubsFromFeed = (content: string, baseUrl: string): Array<HubResult> => {
  try {
    const { format, feed } = parseFeed(content)

    // JSON Feed has native hubs support.
    if (format === 'json') {
      const hubs = feed.hubs ?? []
      const topic = feed.feed_url ?? baseUrl

      return hubs.filter((hub) => hub.url).map((hub) => ({ hub: hub.url as string, topic }))
    }

    // Get links array based on format.
    const links = format === 'atom' ? feed.links : feed.atom?.links
    const hubUris = getLinksWithRel(links, 'hub')

    if (hubUris.length > 0) {
      const selfUris = getLinksWithRel(links, 'self')
      const topic = selfUris[0] ?? baseUrl

      return hubUris.map((hub) => ({ hub, topic }))
    }
  } catch {
    // Silently fail - content is not a valid feed.
  }

  return []
}
