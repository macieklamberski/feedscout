import type { LinkSelector, UriEntry } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { applePodcastsHandler } from './platform/handlers/applePodcasts.js'
import { artstationHandler } from './platform/handlers/artstation.js'
import { behanceHandler } from './platform/handlers/behance.js'
import { blogspotHandler } from './platform/handlers/blogspot.js'
import { blueskyHandler } from './platform/handlers/bluesky.js'
import { codebergHandler } from './platform/handlers/codeberg.js'
import { csdnHandler } from './platform/handlers/csdn.js'
import { dailymotionHandler } from './platform/handlers/dailymotion.js'
import { deviantartHandler } from './platform/handlers/deviantart.js'
import { devtoHandler } from './platform/handlers/devto.js'
import { doubanHandler } from './platform/handlers/douban.js'
import { githubHandler } from './platform/handlers/github.js'
import { githubGistHandler } from './platform/handlers/githubGist.js'
import { gitlabHandler } from './platform/handlers/gitlab.js'
import { goodreadsHandler } from './platform/handlers/goodreads.js'
import { hackernewsHandler } from './platform/handlers/hackernews.js'
import { hashnodeHandler } from './platform/handlers/hashnode.js'
import { hatenablogHandler } from './platform/handlers/hatenablog.js'
import { itchioHandler } from './platform/handlers/itchio.js'
import { kickstarterHandler } from './platform/handlers/kickstarter.js'
import { lemmyHandler } from './platform/handlers/lemmy.js'
import { letterboxdHandler } from './platform/handlers/letterboxd.js'
import { lobstersHandler } from './platform/handlers/lobsters.js'
import { mastodonHandler } from './platform/handlers/mastodon.js'
import { mediumHandler } from './platform/handlers/medium.js'
import { myanimelistHandler } from './platform/handlers/myanimelist.js'
import { odyseeHandler } from './platform/handlers/odysee.js'
import { paragraphHandler } from './platform/handlers/paragraph.js'
import { pinterestHandler } from './platform/handlers/pinterest.js'
import { producthuntHandler } from './platform/handlers/producthunt.js'
import { redditHandler } from './platform/handlers/reddit.js'
import { soundcloudHandler } from './platform/handlers/soundcloud.js'
import { sourceforgeHandler } from './platform/handlers/sourceforge.js'
import { stackExchangeHandler } from './platform/handlers/stackExchange.js'
import { steamHandler } from './platform/handlers/steam.js'
import { substackHandler } from './platform/handlers/substack.js'
import { tistoryHandler } from './platform/handlers/tistory.js'
import { tumblrHandler } from './platform/handlers/tumblr.js'
import { v2exHandler } from './platform/handlers/v2ex.js'
import { velogHandler } from './platform/handlers/velog.js'
import { vimeoHandler } from './platform/handlers/vimeo.js'
import { wordpressHandler } from './platform/handlers/wordpress.js'
import { wpengineHandler } from './platform/handlers/wpengine.js'
import { ximalayaHandler } from './platform/handlers/ximalaya.js'
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
export const urisComprehensive: Array<UriEntry> = [
  ...urisBalanced,
  '/atom',
  '/rss/',
  '/rss2.xml',
  '/feed.rss',
  '/feed.atom',
  '/feed.rss.xml',
  '/feed.atom.xml',
  ['/feed/atom/', '?feed=atom'],
  ['/feed/rss/', '?feed=rss'],
  ['/feed/rss2/', '?feed=rss2'],
  ['/feed/rdf', '?feed=rdf'],
  ['/feed/rdf/', '?feed=rdf'],
  '/index.rss.xml',
  '/index.atom.xml',
  '?format=rss',
  '?format=atom',
  '?rss=1',
  '?atom=1',
  '/.rss',
  '/f.json',
  '/f.rss',
  '/json',
  '/.feed',
  ['/comments/feed', '?feed=comments-rss2'],
  ['/comments/feed/rss2/', '?feed=comments-rss2'],
  ['/comments/feed/rdf/', '?feed=comments-rdf'],
  ['/comments/feed/atom/', '?feed=comments-atom'],
  '/feeds/posts/default',
  '/feeds/posts/default?alt=rss',
  '/feeds/comments/default',
]

// URIs to ignore when discovering feeds from anchor elements.
export const ignoredUris = ['wp-json/oembed/', 'wp-json/wp/']

// Text labels used to identify feed links in anchor elements.
export const anchorLabels = [
  'rss',
  'feed',
  'atom',
  'subscribe',
  'syndicate',
  'syndication',
  'json feed',
]

export const linkSelectors: Array<LinkSelector> = [
  { rel: 'alternate', types: mimeTypes },
  { rel: 'feed' },
]

// Path segments that indicate feed URLs when found within anchor hrefs.
export const anchorPathSegments = [/\/rss\//, /\/atom\//, /\/feed\//]

// Default options for HTML method.
export const defaultHtmlOptions: Omit<HtmlMethodOptions, 'baseUrl'> = {
  linkSelectors,
  anchorUris: [...urisComprehensive.flat(), ...anchorPathSegments],
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
  handlers: [
    applePodcastsHandler,
    artstationHandler,
    behanceHandler,
    blogspotHandler,
    blueskyHandler,
    codebergHandler,
    csdnHandler,
    dailymotionHandler,
    deviantartHandler,
    devtoHandler,
    doubanHandler,
    githubHandler,
    githubGistHandler,
    gitlabHandler,
    goodreadsHandler,
    hackernewsHandler,
    hashnodeHandler,
    hatenablogHandler,
    itchioHandler,
    kickstarterHandler,
    lemmyHandler,
    letterboxdHandler,
    lobstersHandler,
    mastodonHandler,
    mediumHandler,
    odyseeHandler,
    myanimelistHandler,
    paragraphHandler,
    pinterestHandler,
    producthuntHandler,
    redditHandler,
    soundcloudHandler,
    sourceforgeHandler,
    stackExchangeHandler,
    steamHandler,
    substackHandler,
    tistoryHandler,
    tumblrHandler,
    v2exHandler,
    velogHandler,
    vimeoHandler,
    wordpressHandler,
    wpengineHandler,
    ximalayaHandler,
    youtubeHandler,
  ],
}
