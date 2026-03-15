import { parseFeed } from 'feedsmith'
import type { FeedMethodOptions } from './types.js'

export const discoverUrisFromFeed = (
  content: string,
  options: FeedMethodOptions,
): Array<string> => {
  try {
    const { format, feed } = parseFeed(content)
    const urls = options.extractUrls({ format, feed })

    return urls.filter((url) => url != null && url !== '')
  } catch {}

  return []
}
