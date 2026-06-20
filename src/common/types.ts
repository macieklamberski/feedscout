import type { FeedMethodOptions } from './uris/feed/types.js'
import type { GuessMethodOptions } from './uris/guess/types.js'
import type { HeadersMethodOptions } from './uris/headers/types.js'
import type { HtmlMethodOptions } from './uris/html/types.js'
import type { PlatformMethodOptions } from './uris/platform/types.js'

export type MaybePromise<T> = T | Promise<T>

export type Pattern = string | RegExp

export type UriEntry = string | Array<string>

export type DiscoverUriHint = {
  key: string
  label: string
}

export type DiscoverUriEntry = {
  uri: UriEntry
  hint?: DiscoverUriHint
}

export const discoverMethodOrder = ['platform', 'feed', 'html', 'headers', 'guess'] as const

export type DiscoverMethod = (typeof discoverMethodOrder)[number]

export type DiscoverUrisResult = {
  [K in DiscoverMethod]?: Array<DiscoverUriEntry>
}

export type LinkSelector = {
  rel: string
  types?: Array<string>
}

export type DiscoverResolveUrlFn = (url: string, baseUrl: string | undefined) => string | undefined

export type DiscoverResolveSiteUrlFn = (
  input: DiscoverInputObject,
  resolveUrlFn: DiscoverResolveUrlFn,
) => string | undefined

export type DiscoverFetchFnOptions = {
  method?: 'GET' | 'HEAD'
  headers?: Record<string, string>
}

export type DiscoverFetchFnResponse = {
  headers: Headers
  body: string | ReadableStream<Uint8Array>
  url: string
  status: number
  statusText: string
}

export type DiscoverFetchFn = (
  url: string,
  options?: DiscoverFetchFnOptions,
) => MaybePromise<DiscoverFetchFnResponse>

export type DiscoverProgress = {
  tested: number
  total: number
  found: number
  current: string
}

export type DiscoverOnProgressFn = (progress: DiscoverProgress) => void

export type DiscoverErrorContext = {
  phase: 'fetchInput' | 'resolveSiteUrl'
  url?: string
}

export type DiscoverOnErrorFn = (error: unknown, context: DiscoverErrorContext) => void

// Base result type - TValid contains fields present when isValid = true.
export type DiscoverResult<TValid = object> =
  | ({
      url: string
      isValid: true
      method?: DiscoverMethod
      hint?: DiscoverUriHint
    } & TValid)
  | {
      url: string
      isValid: false
      method?: DiscoverMethod
      hint?: DiscoverUriHint
      error?: unknown
    }

// Extract function uses TValid generic.
export type DiscoverExtractFn<TValid> = (input: {
  url: string
  content: string
  headers?: Headers
  status?: number
}) => MaybePromise<DiscoverResult<TValid>>

export type DiscoverInputObject = {
  url: string
  content?: string
  headers?: Headers
}

export type DiscoverInput = string | DiscoverInputObject

// User-facing config - partial options (users override only what they need).
export type DiscoverMethodsConfig<TMethods extends DiscoverMethod = DiscoverMethod> =
  | Array<TMethods>
  | Pick<
      {
        platform?: true | Partial<PlatformMethodOptions>
        feed?: true | Partial<FeedMethodOptions>
        html?: true | Partial<Omit<HtmlMethodOptions, 'baseUrl'>>
        headers?: true | Partial<Omit<HeadersMethodOptions, 'baseUrl'>>
        guess?: true | Partial<Omit<GuessMethodOptions, 'baseUrl'>>
      },
      TMethods
    >

// Defaults for method options (without baseUrl which comes from input).
export type DiscoverMethodsConfigDefaults = {
  platform?: Omit<PlatformMethodOptions, 'baseUrl'>
  feed?: FeedMethodOptions
  html?: Omit<HtmlMethodOptions, 'baseUrl'>
  headers?: Omit<HeadersMethodOptions, 'baseUrl'>
  guess?: Omit<GuessMethodOptions, 'baseUrl'>
}

// Internal methods config with full options and input data.
export type DiscoverMethodsConfigInternal = {
  platform?: {
    content?: string
    headers?: Headers
    options: PlatformMethodOptions
  }
  feed?: {
    content: string
    options: FeedMethodOptions
  }
  html?: {
    html: string
    options: HtmlMethodOptions
  }
  headers?: {
    headers: Headers
    options: HeadersMethodOptions
  }
  guess?: {
    options: GuessMethodOptions
  }
}

// User-facing options - all fields optional for simple usage.
export type DiscoverOptions<TValid, TMethods extends DiscoverMethod = DiscoverMethod> = {
  methods?: DiscoverMethodsConfig<TMethods>
  fetchFn?: DiscoverFetchFn
  extractFn?: DiscoverExtractFn<TValid>
  resolveUrlFn?: DiscoverResolveUrlFn
  resolveSiteUrlFn?: DiscoverResolveSiteUrlFn
  stopOnFirstMethod?: boolean
  stopOnFirstResult?: boolean
  concurrency?: number
  onProgress?: DiscoverOnProgressFn
  onError?: DiscoverOnErrorFn
  includeInvalid?: boolean
}

// Internal options - required fetchFn, extractFn, resolveUrlFn.
export type DiscoverOptionsInternal<TValid> = {
  methods: DiscoverMethodsConfig
  fetchFn: DiscoverFetchFn
  extractFn: DiscoverExtractFn<TValid>
  resolveUrlFn: DiscoverResolveUrlFn
  resolveSiteUrlFn?: DiscoverResolveSiteUrlFn
  stopOnFirstMethod?: boolean
  stopOnFirstResult?: boolean
  concurrency?: number
  includeInvalid?: boolean
  onProgress?: DiscoverOnProgressFn
  onError?: DiscoverOnErrorFn
}
