import { parseFeed } from 'feedsmith'
import type { FeedMethodOptions } from './types.js'

export const discoverUrisFromFeed = (
  content: string,
  options: FeedMethodOptions,
): Array<string> => {
  try {
    const result = parseFeed(content)
    const urls = options.extractUrls(result)

    return urls.filter((url) => url != null && url !== '')
  } catch {}

  return []
}
