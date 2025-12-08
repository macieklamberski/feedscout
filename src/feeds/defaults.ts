import type { LinkSelector } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { deviantartHandler } from './platform/handlers/deviantart.js'
import { githubHandler } from './platform/handlers/github.js'
import { redditHandler } from './platform/handlers/reddit.js'
import { youtubeHandler } from './platform/handlers/youtube.js'

export const mimeTypes = [
  // RSS:
  'application/rss+xml',
  'text/rss+xml',
  'application/x-rss+xml',
  'application/rss',
  // Atom:
  'application/atom+xml',
  'text/atom+xml',
  // JSON Feed:
  'application/feed+json',
  'application/json',
  // RDF:
  'application/rdf+xml',
  'text/rdf+xml',
  'application/atom',
  // Generic:
  'application/xml',
  'text/xml',
]

// Covers modern static generators and simple WordPress setups.
export const urisMinimal = ['/feed', '/rss', '/atom.xml', '/feed.xml', '/rss.xml', '/index.xml']

// Includes JSON Feed and common variations.
export const urisBalanced = [...urisMinimal, '/feed/', '/index.atom', '/index.rss', '/feed.json']

// Includes WordPress query parameters, Blogger patterns, and additional variations.
export const urisComprehensive = [
  ...urisBalanced,
  '/atom',
  '/feed.rss',
  '/feed.atom',
  '/feed.rss.xml',
  '/feed.atom.xml',
  '/index.rss.xml',
  '/index.atom.xml',
  '/?feed=rss',
  '/?feed=rss2',
  '/?feed=atom',
  '/?format=rss',
  '/?format=atom',
  '/?rss=1',
  '/?atom=1',
  '/.rss',
  '/f.json',
  '/f.rss',
  '/json',
  '/.feed',
  '/comments/feed',
  '/feeds/posts/default',
]

// URIs to ignore when discovering feeds from anchor elements.
export const ignoredUris = ['wp-json/oembed/', 'wp-json/wp/']

// Text labels used to identify feed links in anchor elements.
export const anchorLabels = ['rss', 'feed', 'atom', 'subscribe', 'syndicate', 'json feed']

export const linkSelectors: Array<LinkSelector> = [
  { rel: 'alternate', types: mimeTypes },
  { rel: 'feed' },
]

// Default options for HTML method.
export const defaultHtmlOptions: Omit<HtmlMethodOptions, 'baseUrl'> = {
  linkSelectors,
  anchorUris: urisComprehensive,
  anchorIgnoredUris: ignoredUris,
  anchorLabels,
}

// Default options for Headers method.
export const defaultHeadersOptions: Omit<HeadersMethodOptions, 'baseUrl'> = {
  linkSelectors,
}

// Default options for Guess method (excluding baseUrl which is required).
export const defaultGuessOptions: Omit<GuessMethodOptions, 'baseUrl'> = {
  uris: urisBalanced,
}

// Default options for Platform method.
export const defaultPlatformOptions: Omit<PlatformMethodOptions, 'baseUrl'> = {
  handlers: [deviantartHandler, githubHandler, redditHandler, youtubeHandler],
}
