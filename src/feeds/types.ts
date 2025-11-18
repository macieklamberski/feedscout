import type { ExtractFn, FeedInfo, FetchFn, ProgressFn } from '../common/types.js'
import type { Options as GuessOptions } from '../methods/guess/types.js'
import type { Options as HeadersOptions } from '../methods/headers/types.js'
import type { Options as HtmlOptions } from '../methods/html/types.js'

export type DiscoverFeedsInputObject = {
  url: string
  content?: string
  headers?: Headers
}

export type DiscoverFeedsInput = string | DiscoverFeedsInputObject

export type MethodsConfig =
  | Array<'html' | 'headers' | 'guess'>
  | {
      html?: true | Partial<Omit<HtmlOptions, 'baseUrl'>>
      headers?: true | Partial<Omit<HeadersOptions, 'baseUrl'>>
      guess?: true | Partial<Omit<GuessOptions, 'baseUrl'>>
    }

export type DiscoverFeedsOptions<T extends FeedInfo = FeedInfo> = {
  methods: MethodsConfig
  fetchFn?: FetchFn
  extractFn?: ExtractFn<T>
  concurrency?: number
  stopOnFirst?: boolean
  includeInvalid?: boolean
  onProgress?: ProgressFn
}
