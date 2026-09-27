import { parseOpml } from 'feedsmith'
import type { DiscoverExtractFn } from '../common/types.js'
import { isSuccessfulStatus } from '../common/utils.js'
import type { BlogrollResult } from './types.js'

export const defaultExtractFn: DiscoverExtractFn<BlogrollResult> = ({ content, url, status }) => {
  // Never accept the body of a non-2xx response (404/500 error pages) as a blogroll.
  if (!content || !isSuccessfulStatus(status)) {
    return { url, isValid: false }
  }

  try {
    const opml = parseOpml(content)

    return {
      url,
      isValid: true,
      title: opml.head?.title,
    }
  } catch {}

  return { url, isValid: false }
}
