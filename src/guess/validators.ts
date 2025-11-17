import { includesAnyOf, normalizeMimeType } from '../common/utils.js'
import type { ValidatorFn } from './types.js'

/**
 * Validate using MIME type from Content-Type header.
 * Fast but less reliable (servers may return wrong Content-Type).
 */
export const createMimeTypeValidator = (mimeTypes: Array<string>): ValidatorFn => {
  return async (response) => {
    const contentType = response.headers.get('content-type')

    if (!contentType) {
      return { url: response.url, isFeed: false }
    }

    const isValid = includesAnyOf(contentType, mimeTypes, normalizeMimeType)

    if (!isValid) {
      return { url: response.url, isFeed: false }
    }

    // Detect feed format from MIME type.
    const lowerContentType = contentType.toLowerCase()

    if (lowerContentType.includes('rss')) {
      return { url: response.url, isFeed: true, feedFormat: 'rss' }
    }

    if (lowerContentType.includes('atom')) {
      return { url: response.url, isFeed: true, feedFormat: 'atom' }
    }

    if (lowerContentType.includes('json')) {
      return { url: response.url, isFeed: true, feedFormat: 'json' }
    }

    if (lowerContentType.includes('rdf')) {
      return { url: response.url, isFeed: true, feedFormat: 'rdf' }
    }

    // Valid MIME type but couldn't detect specific format.
    // Default to RSS as it's most common.
    return { url: response.url, isFeed: true, feedFormat: 'rss' }
  }
}

/**
 * Validate by checking content for feed markers.
 * Reliable but requires downloading full content.
 *
 * TODO: Replace with feedsmith parsing for robust validation.
 * Currently checks for basic feed markers (<rss>, <feed>, <rdf>).
 * Future: Use feedsmith.parse() to validate actual feed structure.
 */
export const createContentValidator = (): ValidatorFn => {
  return async (response) => {
    // Only handle string body for now.
    // TODO: Add support for streaming body.
    if (typeof response.body !== 'string') {
      return { url: response.url, isFeed: false }
    }

    const content = response.body.toLowerCase()

    // Reject if it looks like HTML.
    if (content.includes('<html')) {
      return { url: response.url, isFeed: false }
    }

    // Detect feed format from content markers.
    if (content.includes('<rss')) {
      return { url: response.url, isFeed: true, feedFormat: 'rss' }
    }

    if (content.includes('<feed')) {
      return { url: response.url, isFeed: true, feedFormat: 'atom' }
    }

    if (content.includes('<rdf')) {
      return { url: response.url, isFeed: true, feedFormat: 'rdf' }
    }

    if (content.includes('"version"')) {
      return { url: response.url, isFeed: true, feedFormat: 'json' }
    }

    return { url: response.url, isFeed: false }
  }
}
