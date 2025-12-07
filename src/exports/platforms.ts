// Platform handlers for feed discovery.

// Default platform options.
export { defaultPlatformOptions } from '../feeds/defaults.js'
export { githubHandler } from '../feeds/platform/handlers/github.js'
export { redditHandler } from '../feeds/platform/handlers/reddit.js'
export { youtubeHandler } from '../feeds/platform/handlers/youtube.js'
// Platform discovery function.
export { discoverPlatformUris } from '../feeds/platform/index.js'

// Types.
export type { PlatformHandler, PlatformMethodOptions } from '../feeds/platform/types.js'
