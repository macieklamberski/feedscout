import type { DiscoverFeedUrisOptions } from '../common/types.js'
import { discoverFeedUrisFromHtml } from './html.js'
import { discoverFeedUrisFromHeaders } from './headers.js'

export const discoverFeedUris = (
  html: string,
  headers?: Headers,
  options?: DiscoverFeedUrisOptions,
): Array<string> => {
  const feedUris = new Set<string>()

  // Determine which methods to run.
  const enabledMethods = options?.methods || (headers ? ['html', 'headers'] : ['html'])

  // Run HTML discovery if enabled and options provided.
  if (enabledMethods.includes('html')) {
    if (options?.html) {
      const htmlUris = discoverFeedUrisFromHtml(html, options.html)
      for (const uri of htmlUris) {
        feedUris.add(uri)
      }
    }
  }

  // Run headers discovery if enabled, headers provided, and options provided.
  if (enabledMethods.includes('headers')) {
    if (headers && options?.headers) {
      const headersUris = discoverFeedUrisFromHeaders(headers, options.headers)
      for (const uri of headersUris) {
        feedUris.add(uri)
      }
    }
  }

  return Array.from(feedUris)
}
