import type { ExtractFn } from '../common/types.js'

/**
 * Default feed extractor using content-based detection.
 *
 * Checks content for feed markers using regex patterns.
 * Does NOT use HTTP headers (headers parameter available for custom extractors).
 *
 * TODO: Replace with feedsmith parsing for robust detection and metadata extraction.
 * Currently uses regex patterns for basic detection.
 * Future: Use feedsmith.parse() to validate feed structure and extract title, description, etc.
 */
export const createDefaultExtractor = (): ExtractFn => {
  return async ({ content, url }) => {
    if (!content) {
      return { url, isFeed: false }
    }

    // Reject if it looks like HTML
    if (/<html/i.test(content)) {
      return { url, isFeed: false }
    }

    // Detect feed format from content markers
    if (/<rss/i.test(content)) {
      return { url, isFeed: true, format: 'rss' }
    }

    if (/<feed/i.test(content)) {
      return { url, isFeed: true, format: 'atom' }
    }

    if (/<rdf/i.test(content)) {
      return { url, isFeed: true, format: 'rdf' }
    }

    // JSON Feed: check for version field with jsonfeed.org URL
    if (/"version"/i.test(content) && /jsonfeed\.org/i.test(content)) {
      return { url, isFeed: true, format: 'json' }
    }

    return { url, isFeed: false }
  }
}
