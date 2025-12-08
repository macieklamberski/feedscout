// Platform handlers for feed discovery.

// Platform discovery function.
export { discoverUrisFromPlatform } from '../common/uris/platform/index.js'
// Types.
export type { PlatformHandler, PlatformMethodOptions } from '../common/uris/platform/types.js'
// Default platform options.
export { defaultPlatformOptions } from '../feeds/defaults.js'
export { githubHandler } from '../feeds/platform/handlers/github.js'
export { redditHandler } from '../feeds/platform/handlers/reddit.js'
export { youtubeHandler } from '../feeds/platform/handlers/youtube.js'
