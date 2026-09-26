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
  format?: 'rss' | 'atom' | 'rdf' | 'json'
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

export type FetchFnOptions = {
  method?: 'GET' | 'HEAD' | 'POST'
  headers?: Record<string, string>
  body?: string
}

export type FetchFnResponse = {
  headers: Headers
  body: string | ReadableStream<Uint8Array>
  url: string // Final URL after redirects
  status: number
}

export type FetchFn<TResponse extends FetchFnResponse = FetchFnResponse> = (
  url: string,
  options?: FetchFnOptions,
) => MaybePromise<TResponse>

/** @deprecated Use `FetchFnOptions`. */
export type DiscoverFetchFnOptions = FetchFnOptions

/** @deprecated Use `FetchFnResponse`. */
export type DiscoverFetchFnResponse = FetchFnResponse & { statusText?: string }

/** @deprecated Use `FetchFn`. */
export type DiscoverFetchFn = FetchFn<DiscoverFetchFnResponse>

export type DiscoverProgress<TValid = object> = {
  tested: number
  total: number
  found: number
  current: string
  method: DiscoverMethod
  result: DiscoverResult<TValid>
}

export type DiscoverOnProgressFn<TValid = object> = (progress: DiscoverProgress<TValid>) => void

export type DiscoverStep =
  | { step: 'fetchInput' | 'resolveSiteUrl'; status: 'start' | 'end'; url: string }
  | { step: 'collect'; status: 'start' | 'end' }
  | { step: 'validate'; status: 'start'; method: DiscoverMethod; total: number }
  | { step: 'validate'; status: 'end'; method: DiscoverMethod; total: number; found: number }

export type DiscoverOnStepFn = (step: DiscoverStep) => void

export type DiscoverErrorContext = {
  phase:
    | 'fetchInput'
    | 'resolveSiteUrl'
    | 'resolveUrlFn'
    | 'resolveSiteUrlFn'
    | 'extractFn'
    | 'platformHandler'
    | 'enrichFn'
    | 'onProgress'
    | 'onStep'
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

// A page whose URI takes an extra request to reach, handed to the enrich function.
export type DiscoverRef = {
  platform: string
  id: string
  url: string
}

// Positional: one entry per ref, undefined where nothing was found.
export type DiscoverEnrichFn = (ref: DiscoverRef) => MaybePromise<Array<string> | undefined>

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
  status?: number
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
  fetchFn?: FetchFn
  extractFn?: DiscoverExtractFn<TValid>
  resolveUrlFn?: DiscoverResolveUrlFn
  resolveSiteUrlFn?: DiscoverResolveSiteUrlFn
  stopOnFirstMethod?: boolean
  stopOnFirstResult?: boolean
  concurrency?: number
  maxUris?: number
  onProgress?: DiscoverOnProgressFn<TValid>
  onStep?: DiscoverOnStepFn
  onError?: DiscoverOnErrorFn
  includeInvalid?: boolean
}

// Internal options - required fetchFn, extractFn, resolveUrlFn.
export type DiscoverOptionsInternal<TValid> = {
  methods: DiscoverMethodsConfig
  fetchFn: FetchFn
  extractFn: DiscoverExtractFn<TValid>
  resolveUrlFn: DiscoverResolveUrlFn
  resolveSiteUrlFn?: DiscoverResolveSiteUrlFn
  ignoredExtensions?: Array<string>
  stopOnFirstMethod?: boolean
  stopOnFirstResult?: boolean
  concurrency?: number
  maxUris?: number
  includeInvalid?: boolean
  onProgress?: DiscoverOnProgressFn<TValid>
  onStep?: DiscoverOnStepFn
  onError?: DiscoverOnErrorFn
}
