import type { parseFeed } from 'feedsmith'

// TODO: Replace with named export when available in Feedsmith 3.x.
export type ParseFeedResult = ReturnType<typeof parseFeed>

export type FeedMethodOptions = {
  extractUrls: (params: ParseFeedResult) => Array<string>
}
