import { parseFeed } from 'feedsmith'
import { trimArray } from 'trousse'
import type { FeedMethodOptions } from './types.js'

export const discoverUrisFromFeed = (
  content: string,
  options: FeedMethodOptions,
): Array<string> => {
  try {
    const result = parseFeed(content)
    const urls = options.extractUrls(result) ?? []

    return trimArray(urls) ?? []
  } catch {}

  return []
}
