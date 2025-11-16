import type { HeadersDiscoveryOptions } from '../headers/types.js'
import type { HtmlDiscoveryOptions } from '../html/types.js'

export type DiscoverFeedUrisOptions = {
  methods?: Array<'html' | 'headers' | 'cms'>
  html?: HtmlDiscoveryOptions
  headers?: HeadersDiscoveryOptions
}
