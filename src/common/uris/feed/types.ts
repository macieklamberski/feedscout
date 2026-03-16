import type { parseFeed } from 'feedsmith'

// TODO: Replace with named export when available in Feedsmith 3.x.
export type FeedMethodData = ReturnType<typeof parseFeed>

export type FeedMethodOptions = {
  extractUrls: (params: FeedMethodData) => Array<string>
}
