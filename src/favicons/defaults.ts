import type { LinkSelector } from '../common/types.js'
import type { FeedMethodOptions } from '../common/uris/feed/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { omitEmpty } from '../common/utils.js'
import { blueskyHandler } from './platform/handlers/bluesky.js'
import { codebergHandler } from './platform/handlers/codeberg.js'
import { deviantartHandler } from './platform/handlers/deviantart.js'
import { githubHandler } from './platform/handlers/github.js'
import { githubGistHandler } from './platform/handlers/githubGist.js'
import { lobstersHandler } from './platform/handlers/lobsters.js'
import { mastodonHandler } from './platform/handlers/mastodon.js'
import { redditHandler } from './platform/handlers/reddit.js'
import { sourceforgeHandler } from './platform/handlers/sourceforge.js'
import { tumblrHandler } from './platform/handlers/tumblr.js'

export const defaultIconRels = [
  'icon',
  'shortcut',
  'apple-touch-icon',
  'apple-touch-icon-precomposed',
]

export const defaultGuessPaths = [
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/favicon.png',
  '/favicon.svg',
]

export const linkSelectors: Array<LinkSelector> = defaultIconRels.map((rel) => ({ rel }))

export const defaultFeedOptions: FeedMethodOptions = {
  extractUrls: ({ format, feed }) => {
    if (format === 'atom') {
      return omitEmpty([feed.icon])
    }

    if (format === 'json') {
      return omitEmpty([feed.favicon, feed.icon])
    }

    return []
  },
}

export const defaultHtmlOptions: Omit<HtmlMethodOptions, 'baseUrl'> = {
  linkSelectors,
  anchorUris: [],
  anchorIgnoredUris: [],
  anchorLabels: [],
}

export const defaultHeadersOptions: Omit<HeadersMethodOptions, 'baseUrl'> = {
  linkSelectors,
}

export const defaultGuessOptions: Omit<GuessMethodOptions, 'baseUrl'> = {
  uris: defaultGuessPaths,
}

export const defaultPlatformOptions: Omit<PlatformMethodOptions, 'baseUrl'> = {
  handlers: [
    githubHandler,
    githubGistHandler,
    mastodonHandler,
    blueskyHandler,
    redditHandler,
    tumblrHandler,
    codebergHandler,
    lobstersHandler,
    sourceforgeHandler,
    deviantartHandler,
  ],
}
