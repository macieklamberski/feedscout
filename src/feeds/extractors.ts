import { parseFeed } from 'feedsmith'
import type { Atom, DeepPartial } from 'feedsmith/types'
import type { ExtractFn } from '../common/types.js'

const getLinkOfType = (links: Array<DeepPartial<Atom.Link<string>>> | undefined, rel: string) => {
  return links?.find((link) => link.rel === rel)
}

export const createFeedsmithExtractor = (): ExtractFn => {
  return async ({ content, url }) => {
    if (!content) {
      return { url, isFeed: false }
    }

    try {
      const { format, feed } = parseFeed(content)

      if (format === 'rss' || format === 'rdf') {
        return {
          url,
          isFeed: true,
          format,
          title: feed.title,
          description: feed.description,
          siteUrl: getLinkOfType(feed.atom?.links, 'alternate')?.href || feed.link,
        }
      }

      if (format === 'atom') {
        return {
          url,
          isFeed: true,
          format,
          title: feed.title,
          description: feed.subtitle,
          siteUrl: getLinkOfType(feed.links, 'alternate')?.href,
        }
      }

      if (format === 'json') {
        return {
          url,
          isFeed: true,
          format,
          title: feed.title,
          description: feed.description,
          siteUrl: feed.home_page_url,
        }
      }
    } catch {
      // Silently fail and go further with the default return.
    }

    return { url, isFeed: false }
  }
}
