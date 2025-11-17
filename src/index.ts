export { discoverFeedUris } from './all/index.js'
export type { Config as DiscoverFeedUrisConfig } from './all/types.js'
export { discoverFeedUrisFromHeaders } from './headers/index.js'
export type { Options as HeadersDiscoveryOptions } from './headers/types.js'
export { createHtmlFeedUrisHandlers } from './html/handlers.js'
export { discoverFeedUrisFromHtml } from './html/index.js'
export type {
  Context as HtmlFeedUrisContext,
  Options as HtmlDiscoveryOptions,
} from './html/types.js'
