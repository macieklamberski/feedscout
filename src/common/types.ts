import type { GuessMethodOptions } from './uris/guess/types.js'
import type { HeadersMethodOptions } from './uris/headers/types.js'
import type { HtmlMethodOptions } from './uris/html/types.js'
import type { PlatformMethodOptions } from './uris/platform/types.js'

export type LinkSelector = {
	rel: string
	types?: Array<string>
}

export type DiscoverNormalizeUrlFn = (url: string, baseUrl: string | undefined) => string

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
) => Promise<DiscoverFetchFnResponse>

export type DiscoverProgress = {
	tested: number
	total: number
	found: number
	current: string
}

export type DiscoverOnProgressFn = (progress: DiscoverProgress) => void

// Base result type - TValid contains fields present when isValid = true.
export type DiscoverResult<TValid = object> =
	| ({
			url: string
			isValid: true
	  } & TValid)
	| {
			url: string
			isValid: false
			error?: unknown
	  }

// Extract function uses TValid generic.
export type DiscoverExtractFn<TValid> = (input: {
	url: string
	content: string
	headers?: Headers
}) => Promise<DiscoverResult<TValid>>

export type DiscoverInputObject = {
	url: string
	content?: string
	headers?: Headers
}

export type DiscoverInput = string | DiscoverInputObject

// User-facing config - partial options (users override only what they need).
export type DiscoverMethodsConfig =
	| Array<'platform' | 'html' | 'headers' | 'guess'>
	| {
			platform?: true | Partial<PlatformMethodOptions>
			html?: true | Partial<Omit<HtmlMethodOptions, 'baseUrl'>>
			headers?: true | Partial<Omit<HeadersMethodOptions, 'baseUrl'>>
			guess?: true | Partial<Omit<GuessMethodOptions, 'baseUrl'>>
	  }

// Defaults for method options (without baseUrl which comes from input).
export type DiscoverMethodsConfigDefaults = {
	platform: Omit<PlatformMethodOptions, 'baseUrl'>
	html: Omit<HtmlMethodOptions, 'baseUrl'>
	headers: Omit<HeadersMethodOptions, 'baseUrl'>
	guess: Omit<GuessMethodOptions, 'baseUrl'>
}

// Internal methods config with full options and input data.
export type DiscoverMethodsConfigInternal = {
	platform?: {
		html: string
		options: PlatformMethodOptions
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
export type DiscoverOptions<TValid> = {
	methods?: DiscoverMethodsConfig
	fetchFn?: DiscoverFetchFn
	extractFn?: DiscoverExtractFn<TValid>
	normalizeUrlFn?: DiscoverNormalizeUrlFn
	concurrency?: number
	stopOnFirstResult?: boolean
	includeInvalid?: boolean
	onProgress?: DiscoverOnProgressFn
}

// Internal options - required fetchFn, extractFn, normalizeUrlFn.
export type DiscoverOptionsInternal<TValid> = {
	methods: DiscoverMethodsConfig
	fetchFn: DiscoverFetchFn
	extractFn: DiscoverExtractFn<TValid>
	normalizeUrlFn: DiscoverNormalizeUrlFn
	concurrency?: number
	stopOnFirstResult?: boolean
	includeInvalid?: boolean
	onProgress?: DiscoverOnProgressFn
}
