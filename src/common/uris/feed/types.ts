import type { parseFeed } from 'feedsmith'

// TODO: Replace with named export when available in Feedsmith 3.x.
export type FeedMethodData = ReturnType<typeof parseFeed<string>>

export type FeedMethodOptions = {
  extractUrls: (params: FeedMethodData) => Array<string> | undefined
}
