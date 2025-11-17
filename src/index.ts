// Main orchestrator.
export { discoverFeedUris } from './all/index.js'
// Types.
export type { DiscoverFeedUrisOptions } from './all/types.js'
export { discoverFeedUrisFromHeaders } from './headers/index.js'
export type { HeadersDiscoveryOptions } from './headers/types.js'
// Handler creators for custom workflows.
export { createHtmlFeedUrisHandlers } from './html/handlers.js'
// Method-specific discovery.
export { discoverFeedUrisFromHtml } from './html/index.js'
export type { HtmlDiscoveryOptions, HtmlFeedUrisContext } from './html/types.js'
