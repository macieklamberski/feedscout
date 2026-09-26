import type { LinkSelector, Pattern, UriEntry } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { acastHandler } from './platforms/acast.js'
import { amebloHandler } from './platforms/ameblo.js'
import { applePodcastsHandler } from './platforms/applePodcasts.js'
import { arenaHandler } from './platforms/arena.js'
import { art19Handler } from './platforms/art19.js'
import { artstationHandler } from './platforms/artstation.js'
import { audioboomHandler } from './platforms/audioboom.js'
import { bearblogHandler } from './platforms/bearblog.js'
import { behanceHandler } from './platforms/behance.js'
import { bitchuteHandler } from './platforms/bitchute.js'
import { blogspotHandler } from './platforms/blogspot.js'
import { blueskyHandler } from './platforms/bluesky.js'
import { bookwyrmHandler } from './platforms/bookwyrm.js'
import { buttondownHandler } from './platforms/buttondown.js'
import { buzzsproutHandler } from './platforms/buzzsprout.js'
import { cnblogsHandler } from './platforms/cnblogs.js'
import { confluenceHandler } from './platforms/confluence.js'
import { csdnHandler } from './platforms/csdn.js'
import { dailymotionHandler } from './platforms/dailymotion.js'
import { deviantartHandler } from './platforms/deviantart.js'
import { devtoHandler } from './platforms/devto.js'
import { diasporaHandler } from './platforms/diaspora.js'
import { discourseHandler } from './platforms/discourse.js'
import { discuzHandler } from './platforms/discuz.js'
import { doubanHandler } from './platforms/douban.js'
import { dreamwidthHandler } from './platforms/dreamwidth.js'
import { drupalHandler } from './platforms/drupal.js'
import { exblogHandler } from './platforms/exblog.js'
import { fc2Handler } from './platforms/fc2.js'
import { firesideHandler } from './platforms/fireside.js'
import { flickrHandler } from './platforms/flickr.js'
import { fluxbbHandler } from './platforms/fluxbb.js'
import { friendicaHandler } from './platforms/friendica.js'
import { funkwhaleHandler } from './platforms/funkwhale.js'
import { ghostHandler } from './platforms/ghost.js'
import { giteaHandler } from './platforms/gitea.js'
import { githubHandler } from './platforms/github.js'
import { githubGistHandler } from './platforms/githubGist.js'
import { gitlabHandler } from './platforms/gitlab.js'
import { goodreadsHandler } from './platforms/goodreads.js'
import { gravHandler } from './platforms/grav.js'
import { habrHandler } from './platforms/habr.js'
import { hackernewsHandler } from './platforms/hackernews.js'
import { hashnodeHandler } from './platforms/hashnode.js'
import { hatenaBookmarkHandler } from './platforms/hatenaBookmark.js'
import { hatenablogHandler } from './platforms/hatenablog.js'
import { hearthisHandler } from './platforms/hearthis.js'
import { heyWorldHandler } from './platforms/heyWorld.js'
import { homelandHandler } from './platforms/homeland.js'
import { hubspotHandler } from './platforms/hubspot.js'
import { hubzillaHandler } from './platforms/hubzilla.js'
import { insanejournalHandler } from './platforms/insanejournal.js'
import { itchioHandler } from './platforms/itchio.js'
import { jiraHandler } from './platforms/jira.js'
import { joomlaHandler } from './platforms/joomla.js'
import { kickstarterHandler } from './platforms/kickstarter.js'
import { learnkuHandler } from './platforms/learnku.js'
import { lemmyHandler } from './platforms/lemmy.js'
import { letterboxdHandler } from './platforms/letterboxd.js'
import { libsynHandler } from './platforms/libsyn.js'
import { listedHandler } from './platforms/listed.js'
import { livejournalHandler } from './platforms/livejournal.js'
import { lobstersHandler } from './platforms/lobsters.js'
import { mailchimpHandler } from './platforms/mailchimp.js'
import { mastodonHandler } from './platforms/mastodon.js'
import { mataroaHandler } from './platforms/mataroa.js'
import { mediumHandler } from './platforms/medium.js'
import { microblogHandler } from './platforms/microblog.js'
import { misskeyHandler } from './platforms/misskey.js'
import { mobilizonHandler } from './platforms/mobilizon.js'
import { myanimelistHandler } from './platforms/myanimelist.js'
import { naverBlogHandler } from './platforms/naverBlog.js'
import { nebulaHandler } from './platforms/nebula.js'
import { neocitiesHandler } from './platforms/neocities.js'
import { nodebbHandler } from './platforms/nodebb.js'
import { noteHandler } from './platforms/note.js'
import { observableHandler } from './platforms/observable.js'
import { odyseeHandler } from './platforms/odysee.js'
import { omnystudioHandler } from './platforms/omnystudio.js'
import { openstatusHandler } from './platforms/openstatus.js'
import { pagecordHandler } from './platforms/pagecord.js'
import { paragraphHandler } from './platforms/paragraph.js'
import { peertubeHandler } from './platforms/peertube.js'
import { phpbbHandler } from './platforms/phpbb.js'
import { pikaHandler } from './platforms/pika.js'
import { pinterestHandler } from './platforms/pinterest.js'
import { pixelfedHandler } from './platforms/pixelfed.js'
import { pleromaHandler } from './platforms/pleroma.js'
import { podbeanHandler } from './platforms/podbean.js'
import { podigeeHandler } from './platforms/podigee.js'
import { podomaticHandler } from './platforms/podomatic.js'
import { posthavenHandler } from './platforms/posthaven.js'
import { postypeHandler } from './platforms/postype.js'
import { powerpressHandler } from './platforms/powerpress.js'
import { producthuntHandler } from './platforms/producthunt.js'
import { proseHandler } from './platforms/prose.js'
import { publiiHandler } from './platforms/publii.js'
import { qiitaHandler } from './platforms/qiita.js'
import { redditHandler } from './platforms/reddit.js'
import { rssComHandler } from './platforms/rssCom.js'
import { seesaaHandler } from './platforms/seesaa.js'
import { shaarliHandler } from './platforms/shaarli.js'
import { shopifyHandler } from './platforms/shopify.js'
import { snacHandler } from './platforms/snac.js'
import { soundcloudHandler } from './platforms/soundcloud.js'
import { sourceforgeHandler } from './platforms/sourceforge.js'
import { sourcehutHandler } from './platforms/sourcehut.js'
import { spreakerHandler } from './platforms/spreaker.js'
import { squarespaceHandler } from './platforms/squarespace.js'
import { stackExchangeHandler } from './platforms/stackExchange.js'
import { steamHandler } from './platforms/steam.js'
import { substackHandler } from './platforms/substack.js'
import { svbtleHandler } from './platforms/svbtle.js'
import { syosetuHandler } from './platforms/syosetu.js'
import { textpatternHandler } from './platforms/textpattern.js'
import { tildesHandler } from './platforms/tildes.js'
import { tistoryHandler } from './platforms/tistory.js'
import { togetterHandler } from './platforms/togetter.js'
import { transistorHandler } from './platforms/transistor.js'
import { tumblrHandler } from './platforms/tumblr.js'
import { v2exHandler } from './platforms/v2ex.js'
import { velogHandler } from './platforms/velog.js'
import { vimeoHandler } from './platforms/vimeo.js'
import { weblogLolHandler } from './platforms/weblogLol.js'
import { weeblyHandler } from './platforms/weebly.js'
import { wikidotHandler } from './platforms/wikidot.js'
import { wixHandler } from './platforms/wix.js'
import { wordpressHandler } from './platforms/wordpress.js'
import { wpengineHandler } from './platforms/wpengine.js'
import { writeasHandler } from './platforms/writeas.js'
import { writefreelyHandler } from './platforms/writefreely.js'
import { xenforoHandler } from './platforms/xenforo.js'
import { ximalayaHandler } from './platforms/ximalaya.js'
import { youtubeHandler } from './platforms/youtube.js'
import { zennHandler } from './platforms/zenn.js'

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

// Subscribe/share endpoints (Add to My Yahoo, Netvibes, Google Podcasts, AddThis, affiliate
// redirectors, …) pass the real feed URL as a query parameter, e.g. ?url=http…, ?feed=aHR0c…
// (base64 of "http"). They would otherwise match on their "Subscribe"/"RSS" link text and waste
// a fetch, so ignore any anchor whose href carries an embedded URL.
const wrappedFeedUrlRegex = /[?&][^=&]*=(https?:|https?%3a|aHR0c)/i

// An audio or video file is never a feed, but a podcast host's tracking prefix can put a feed
// segment in its path (`pscrb.fm/rss/p/…/episode.mp3`), and validating it downloads the file.
const mediaFileRegex = /\.(?:aac|flac|m4a|m4v|mov|mp3|mp4|oga|ogg|ogv|opus|wav|webm)(?:[?#]|$)/i

// URIs to ignore when discovering feeds from anchor elements.
export const ignoredUris: Array<Pattern> = [
  'wp-json/oembed/',
  'wp-json/wp/',
  wrappedFeedUrlRegex,
  mediaFileRegex,
]

// Text labels used to identify feed links in anchor elements. "subscribe" is deliberately
// excluded: on its own it overwhelmingly marks podcast-app, YouTube, and newsletter buttons
// rather than feeds, and real feed links are still caught by their href or an rss/feed/atom label.
export const anchorLabels = ['rss', 'feed', 'atom', 'syndicate', 'syndication', 'json feed']

export const linkSelectors: Array<LinkSelector> = [
  { rel: 'alternate', types: mimeTypes },
  { rel: 'feed' },
]

// Path segments that indicate feed URLs when found in an anchor href's pathname.
export const anchorPathSegments = [/\/rss\//, /\/atom\//, /\/feed\//]

// Descendant attributes scanned for feed labels on icon-only anchors that carry no text or label
// of their own. Framer names its feed-icon layer with data-framer-name (e.g. "RSS Icon"), which is
// the common case this covers. "class" is intentionally excluded: anchorLabels match as substrings,
// so labels collide with ordinary class names ("feed" in "feedback", "atom" in "atomic").
export const anchorAttributes = ['aria-label', 'title', 'data-framer-name']

// Default options for HTML method.
export const defaultHtmlOptions: Omit<HtmlMethodOptions, 'baseUrl'> = {
  linkSelectors,
  anchorUris: urisComprehensive.flat(),
  anchorPathSegments,
  anchorIgnoredUris: ignoredUris,
  anchorLabels,
  anchorAttributes,
}

// Default options for Headers method.
export const defaultHeadersOptions: Omit<HeadersMethodOptions, 'baseUrl'> = {
  linkSelectors,
}

// Path segments of same-origin links that mark a content section likely to host its own feed.
export const sectionNames = [
  'blog',
  'news',
  'posts',
  'articles',
  'writing',
  'notes',
  'journal',
  'podcast',
  'changelog',
]

// Default options for Guess method (excluding baseUrl which is required).
export const defaultGuessOptions: Omit<GuessMethodOptions, 'baseUrl'> = {
  uris: urisBalanced,
  maxAncestorDepth: 2,
  sectionNames,
}

// Default options for Platform method.
export const defaultPlatformOptions: Omit<PlatformMethodOptions, 'baseUrl'> = {
  handlers: [
    acastHandler,
    amebloHandler,
    applePodcastsHandler,
    arenaHandler,
    art19Handler,
    artstationHandler,
    audioboomHandler,
    bearblogHandler,
    behanceHandler,
    bitchuteHandler,
    blogspotHandler,
    blueskyHandler,
    bookwyrmHandler,
    buttondownHandler,
    buzzsproutHandler,
    cnblogsHandler,
    confluenceHandler,
    csdnHandler,
    dailymotionHandler,
    deviantartHandler,
    devtoHandler,
    diasporaHandler,
    discourseHandler,
    discuzHandler,
    doubanHandler,
    dreamwidthHandler,
    drupalHandler,
    exblogHandler,
    fc2Handler,
    firesideHandler,
    flickrHandler,
    fluxbbHandler,
    friendicaHandler,
    funkwhaleHandler,
    ghostHandler,
    giteaHandler,
    githubHandler,
    githubGistHandler,
    gitlabHandler,
    goodreadsHandler,
    gravHandler,
    habrHandler,
    hackernewsHandler,
    hashnodeHandler,
    hatenaBookmarkHandler,
    hatenablogHandler,
    hearthisHandler,
    heyWorldHandler,
    homelandHandler,
    hubspotHandler,
    hubzillaHandler,
    insanejournalHandler,
    itchioHandler,
    jiraHandler,
    joomlaHandler,
    kickstarterHandler,
    learnkuHandler,
    lemmyHandler,
    letterboxdHandler,
    libsynHandler,
    listedHandler,
    livejournalHandler,
    lobstersHandler,
    mailchimpHandler,
    mastodonHandler,
    mataroaHandler,
    mediumHandler,
    microblogHandler,
    misskeyHandler,
    mobilizonHandler,
    myanimelistHandler,
    naverBlogHandler,
    nebulaHandler,
    neocitiesHandler,
    nodebbHandler,
    noteHandler,
    observableHandler,
    odyseeHandler,
    omnystudioHandler,
    openstatusHandler,
    pagecordHandler,
    paragraphHandler,
    peertubeHandler,
    phpbbHandler,
    pikaHandler,
    pinterestHandler,
    pixelfedHandler,
    pleromaHandler,
    podbeanHandler,
    podigeeHandler,
    podomaticHandler,
    posthavenHandler,
    postypeHandler,
    powerpressHandler,
    producthuntHandler,
    proseHandler,
    publiiHandler,
    qiitaHandler,
    redditHandler,
    rssComHandler,
    seesaaHandler,
    shaarliHandler,
    shopifyHandler,
    snacHandler,
    soundcloudHandler,
    sourceforgeHandler,
    sourcehutHandler,
    spreakerHandler,
    squarespaceHandler,
    stackExchangeHandler,
    steamHandler,
    substackHandler,
    svbtleHandler,
    syosetuHandler,
    textpatternHandler,
    tildesHandler,
    tistoryHandler,
    togetterHandler,
    transistorHandler,
    tumblrHandler,
    v2exHandler,
    velogHandler,
    vimeoHandler,
    weblogLolHandler,
    weeblyHandler,
    wikidotHandler,
    wixHandler,
    wordpressHandler,
    wpengineHandler,
    writeasHandler,
    writefreelyHandler,
    xenforoHandler,
    ximalayaHandler,
    youtubeHandler,
    zennHandler,
  ],
}
