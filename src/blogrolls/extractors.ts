import { parseOpml } from 'feedsmith'
import type { DiscoverExtractFn } from '../common/types.js'
import type { BlogrollResult } from './types.js'

export const defaultExtractor: DiscoverExtractFn<BlogrollResult> = async ({ content, url }) => {
  if (!content) {
    return { url, isValid: false }
  }

  try {
    const opml = parseOpml(content)

    return {
      url,
      isValid: true,
      title: opml.head?.title,
    }
  } catch {
    return { url, isValid: false }
  }
}
