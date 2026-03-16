import { parseFeed } from 'feedsmith'
import { omitEmpty } from '../../utils.js'
import type { FeedMethodOptions } from './types.js'

export const discoverUrisFromFeed = (
  content: string,
  options: FeedMethodOptions,
): Array<string> => {
  try {
    const result = parseFeed(content)
    const urls = options.extractUrls(result)

    return omitEmpty(urls)
  } catch {}

  return []
}
