import type { Atom } from 'feedsmith'
import { parseFeed } from 'feedsmith'
import { isNonEmptyString } from 'trousse'
import type { DiscoverOnErrorFn, DiscoverResolveUrlFn } from '../../common/types.js'
import type { HubResult } from '../discover/types.js'
import { toHubResults } from '../utils.js'

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
  resolveUrlFn: DiscoverResolveUrlFn,
  onError?: DiscoverOnErrorFn,
): Array<HubResult> => {
  try {
    const { format, feed } = parseFeed(content)

    // JSON Feed has native hubs support.
    if (format === 'json') {
      const hubUris = (feed.hubs ?? []).map((hub) => hub.url).filter(isNonEmptyString)

      return toHubResults(hubUris, feed.feed_url, baseUrl, resolveUrlFn, onError)
    }

    // Get links array based on format.
    const links = format === 'atom' ? feed.links : feed.atom?.links
    const hubUris = getLinksWithRel(links, 'hub')

    if (hubUris.length > 0) {
      const selfUris = getLinksWithRel(links, 'self')

      return toHubResults(hubUris, selfUris[0], baseUrl, resolveUrlFn, onError)
    }
  } catch {
    // Silently fail - content is not a valid feed.
  }

  return []
}
