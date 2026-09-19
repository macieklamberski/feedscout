import { parseFeed } from 'feedsmith'
import { defaultResolveUrlFn } from '../common/discover/defaults.js'
import { getFeedSiteUrl } from '../common/discover/utils.js'
import type { DiscoverExtractFn } from '../common/types.js'
import { isSuccessfulStatus } from '../common/utils.js'
import type { FeedResult } from './types.js'

export const defaultExtractFn: DiscoverExtractFn<FeedResult> = ({ content, url, status }) => {
  // Never accept the body of a non-2xx response (404/500 error pages) as a feed.
  if (!content || !isSuccessfulStatus(status)) {
    return { url, isValid: false }
  }

  try {
    const parsed = parseFeed(content)
    const { format, feed } = parsed
    const rawSiteUrl = getFeedSiteUrl(parsed)
    const siteUrl = rawSiteUrl ? defaultResolveUrlFn(rawSiteUrl, url) : undefined

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
        title: feed.title?.value,
        description: feed.subtitle?.value,
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
