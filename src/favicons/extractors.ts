import type { DiscoverExtractFn } from '../common/types.js'
import type { FaviconResult } from './types.js'

export const defaultExtractor: DiscoverExtractFn<FaviconResult> = async ({ url, status }) => {
  if (status !== undefined && status >= 200 && status < 400) {
    return { url, isValid: true }
  }

  return { url, isValid: false }
}
