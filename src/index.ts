// Main orchestrator.
export { discoverFeedUris } from './discover/orchestrator.js'

// Method-specific discovery.
export { discoverFeedUrisFromHtml } from './discover/html.js'
export { discoverFeedUrisFromHeaders } from './discover/headers.js'
export { discoverFeedUrisFromCmsHtml, discoverFeedUrisFromCmsHeaders } from './discover/cms.js'

// CMS detection utilities.
export { detectCms, detectCmsFromHeaders } from './discover/cms.js'

// Handler creators for custom workflows.
export { createHtmlFeedUrisHandlers } from './common/utils.js'
export { createHtmlCmsTypeHandlers } from './discover/cms.js'

// Types.
export type {
  DiscoverFeedUrisOptions,
  HtmlDiscoveryOptions,
  HeadersDiscoveryOptions,
  HtmlFeedUrisContext,
} from './common/types.js'
export type { HtmlCmsTypeContext } from './discover/cms.js'
