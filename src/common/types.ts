export type FeedInfo =
  | {
      url: string
      isFeed: true
      format: 'rss' | 'atom' | 'json' | 'rdf'
      title?: string
      description?: string
      siteUrl?: string
      method?: 'html' | 'headers' | 'guess'
    }
  | {
      url: string
      isFeed: false
      error?: string
    }

export type FetchFnOptions = {
  method?: 'GET' | 'HEAD'
  headers?: Record<string, string>
}

export type FetchFnResponse = {
  headers: Headers
  body: string | ReadableStream<Uint8Array>
  url: string
  status: number
  statusText: string
}

export type FetchFn = (url: string, options?: FetchFnOptions) => Promise<FetchFnResponse>

export type Progress = {
  tested: number
  total: number
  found: number
  current: string
}

export type ProgressFn = (progress: Progress) => void

export type ExtractFn<T extends FeedInfo = FeedInfo> = (input: {
  url: string
  content: string
  headers?: Headers
}) => Promise<T>

export type ValidatorFn = (response: FetchFnResponse) => Promise<FeedInfo>
