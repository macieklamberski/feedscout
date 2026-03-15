export type FeedMethodOptions = {
  extractUrls: (params: { format: string; feed: unknown }) => Array<string>
}
