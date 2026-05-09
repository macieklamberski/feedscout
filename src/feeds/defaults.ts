import type { LinkSelector, UriEntry } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { acastHandler } from './platform/handlers/acast.js'
import { amebloHandler } from './platform/handlers/ameblo.js'
import { applePodcastsHandler } from './platform/handlers/applePodcasts.js'
import { arenaHandler } from './platform/handlers/arena.js'
import { artstationHandler } from './platform/handlers/artstation.js'
import { audioboomHandler } from './platform/handlers/audioboom.js'
import { bearblogHandler } from './platform/handlers/bearblog.js'
import { behanceHandler } from './platform/handlers/behance.js'
import { blogspotHandler } from './platform/handlers/blogspot.js'
import { blueskyHandler } from './platform/handlers/bluesky.js'
import { bookwyrmHandler } from './platform/handlers/bookwyrm.js'
import { buttondownHandler } from './platform/handlers/buttondown.js'
import { buzzsproutHandler } from './platform/handlers/buzzsprout.js'
import { codebergHandler } from './platform/handlers/codeberg.js'
import { csdnHandler } from './platform/handlers/csdn.js'
import { dailymotionHandler } from './platform/handlers/dailymotion.js'
import { deviantartHandler } from './platform/handlers/deviantart.js'
import { devtoHandler } from './platform/handlers/devto.js'
import { discourseHandler } from './platform/handlers/discourse.js'
import { doubanHandler } from './platform/handlers/douban.js'
import { dreamwidthHandler } from './platform/handlers/dreamwidth.js'
import { exblogHandler } from './platform/handlers/exblog.js'
import { firesideHandler } from './platform/handlers/fireside.js'
import { friendicaHandler } from './platform/handlers/friendica.js'
import { ghostHandler } from './platform/handlers/ghost.js'
import { githubHandler } from './platform/handlers/github.js'
import { githubGistHandler } from './platform/handlers/githubGist.js'
import { gitlabHandler } from './platform/handlers/gitlab.js'
import { goodreadsHandler } from './platform/handlers/goodreads.js'
import { hackernewsHandler } from './platform/handlers/hackernews.js'
import { hashnodeHandler } from './platform/handlers/hashnode.js'
import { hatenablogHandler } from './platform/handlers/hatenablog.js'
import { hearthisHandler } from './platform/handlers/hearthis.js'
import { heyWorldHandler } from './platform/handlers/heyWorld.js'
import { insanejournalHandler } from './platform/handlers/insanejournal.js'
import { itchioHandler } from './platform/handlers/itchio.js'
import { kickstarterHandler } from './platform/handlers/kickstarter.js'
import { lemmyHandler } from './platform/handlers/lemmy.js'
import { letterboxdHandler } from './platform/handlers/letterboxd.js'
import { libsynHandler } from './platform/handlers/libsyn.js'
import { listedHandler } from './platform/handlers/listed.js'
import { lobstersHandler } from './platform/handlers/lobsters.js'
import { mastodonHandler } from './platform/handlers/mastodon.js'
import { mediumHandler } from './platform/handlers/medium.js'
import { myanimelistHandler } from './platform/handlers/myanimelist.js'
import { nebulaHandler } from './platform/handlers/nebula.js'
import { noteHandler } from './platform/handlers/note.js'
import { odyseeHandler } from './platform/handlers/odysee.js'
import { pagecordHandler } from './platform/handlers/pagecord.js'
import { paragraphHandler } from './platform/handlers/paragraph.js'
import { pinterestHandler } from './platform/handlers/pinterest.js'
import { producthuntHandler } from './platform/handlers/producthunt.js'
import { proseHandler } from './platform/handlers/prose.js'
import { redditHandler } from './platform/handlers/reddit.js'
import { soundcloudHandler } from './platform/handlers/soundcloud.js'
import { sourceforgeHandler } from './platform/handlers/sourceforge.js'
import { stackExchangeHandler } from './platform/handlers/stackExchange.js'
import { steamHandler } from './platform/handlers/steam.js'
import { substackHandler } from './platform/handlers/substack.js'
import { tistoryHandler } from './platform/handlers/tistory.js'
import { transistorHandler } from './platform/handlers/transistor.js'
import { tumblrHandler } from './platform/handlers/tumblr.js'
import { v2exHandler } from './platform/handlers/v2ex.js'
import { velogHandler } from './platform/handlers/velog.js'
import { vimeoHandler } from './platform/handlers/vimeo.js'
import { wordpressHandler } from './platform/handlers/wordpress.js'
import { wpengineHandler } from './platform/handlers/wpengine.js'
import { writeasHandler } from './platform/handlers/writeas.js'
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
    acastHandler,
    amebloHandler,
    applePodcastsHandler,
    arenaHandler,
    artstationHandler,
    audioboomHandler,
    bearblogHandler,
    behanceHandler,
    blogspotHandler,
    blueskyHandler,
    bookwyrmHandler,
    buttondownHandler,
    buzzsproutHandler,
    codebergHandler,
    csdnHandler,
    dailymotionHandler,
    deviantartHandler,
    devtoHandler,
    discourseHandler,
    doubanHandler,
    dreamwidthHandler,
    exblogHandler,
    firesideHandler,
    friendicaHandler,
    ghostHandler,
    githubHandler,
    githubGistHandler,
    gitlabHandler,
    goodreadsHandler,
    hackernewsHandler,
    hashnodeHandler,
    hatenablogHandler,
    hearthisHandler,
    heyWorldHandler,
    insanejournalHandler,
    itchioHandler,
    kickstarterHandler,
    lemmyHandler,
    letterboxdHandler,
    libsynHandler,
    listedHandler,
    lobstersHandler,
    mastodonHandler,
    mediumHandler,
    myanimelistHandler,
    nebulaHandler,
    noteHandler,
    odyseeHandler,
    pagecordHandler,
    paragraphHandler,
    pinterestHandler,
    producthuntHandler,
    proseHandler,
    redditHandler,
    soundcloudHandler,
    sourceforgeHandler,
    stackExchangeHandler,
    steamHandler,
    substackHandler,
    tistoryHandler,
    transistorHandler,
    tumblrHandler,
    v2exHandler,
    velogHandler,
    vimeoHandler,
    wordpressHandler,
    wpengineHandler,
    writeasHandler,
    ximalayaHandler,
    youtubeHandler,
  ],
}
