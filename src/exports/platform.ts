// Platform handlers for feed discovery.

// Platform discovery function.
export { discoverUrisFromPlatform } from '../common/uris/platform/index.js'
// Types.
export type { PlatformHandler, PlatformMethodOptions } from '../common/uris/platform/types.js'
// Default platform options.
export { defaultPlatformOptions } from '../feeds/defaults.js'
// Individual handlers.
export { applePodcastsHandler } from '../feeds/platform/handlers/applePodcasts.js'
export { blogspotHandler } from '../feeds/platform/handlers/blogspot.js'
export { blueskyHandler } from '../feeds/platform/handlers/bluesky.js'
export { deviantartHandler } from '../feeds/platform/handlers/deviantart.js'
export { devtoHandler } from '../feeds/platform/handlers/devto.js'
export { githubHandler } from '../feeds/platform/handlers/github.js'
export { githubGistHandler } from '../feeds/platform/handlers/githubGist.js'
export { mastodonHandler } from '../feeds/platform/handlers/mastodon.js'
export { mediumHandler } from '../feeds/platform/handlers/medium.js'
export { redditHandler } from '../feeds/platform/handlers/reddit.js'
export { substackHandler } from '../feeds/platform/handlers/substack.js'
export { tumblrHandler } from '../feeds/platform/handlers/tumblr.js'
export { wordpressHandler } from '../feeds/platform/handlers/wordpress.js'
export { youtubeHandler } from '../feeds/platform/handlers/youtube.js'
