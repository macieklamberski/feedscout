import { parseFeed } from 'feedsmith'
import { getFeedSiteUrl } from '../common/discover/utils.js'
import type { DiscoverExtractFn } from '../common/types.js'
import { resolveUrl } from '../common/utils.js'
import type { FeedResult } from './types.js'

export const defaultExtractor: DiscoverExtractFn<FeedResult> = ({ content, url }) => {
  if (!content) {
    return { url, isValid: false }
  }

  try {
    const parsed = parseFeed(content)
    const { format, feed } = parsed
    const rawSiteUrl = getFeedSiteUrl(parsed)
    const siteUrl = rawSiteUrl ? resolveUrl(rawSiteUrl, url) : undefined

    if (format === 'rss' || format === 'rdf') {
      return {
        url,
        isValid: true,
        format,
        title: feed.title,
        description: feed.description,
        siteUrl,
      }
    }

    if (format === 'atom') {
      return {
        url,
        isValid: true,
        format,
        title: feed.title,
        description: feed.subtitle,
        siteUrl,
      }
    }

    if (format === 'json') {
      return {
        url,
        isValid: true,
        format,
        title: feed.title,
        description: feed.description,
        siteUrl,
      }
    }
  } catch {
    // Silently fail and go further with the default return.
  }

  return { url, isValid: false }
}
