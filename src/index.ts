// Main orchestrator.
export { discoverFeedUris } from './discover/orchestrator.js'

// Method-specific discovery.
export { discoverFeedUrisFromHtml } from './discover/html.js'
export { discoverFeedUrisFromHeaders } from './discover/headers.js'

// Handler creators for custom workflows.
export { createHtmlFeedUrisHandlers } from './common/utils.js'

// Types.
export type {
  DiscoverFeedUrisOptions,
  HtmlDiscoveryOptions,
  HeadersDiscoveryOptions,
  HtmlFeedUrisContext,
} from './common/types.js'
