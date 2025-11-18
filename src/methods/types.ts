import type { Options as GuessOptions } from './guess/types.js'
import type { Options as HeadersOptions } from './headers/types.js'
import type { Options as HtmlOptions } from './html/types.js'

export type Config = {
  html?: {
    html: string
    options: HtmlOptions
  }
  headers?: {
    headers: Headers
    options: HeadersOptions
  }
  guess?: {
    options: GuessOptions
  }
}
