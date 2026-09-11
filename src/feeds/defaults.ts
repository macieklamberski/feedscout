import type { LinkSelector, Pattern, UriEntry } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { acastHandler } from './platform/handlers/acast.js'
import { amebloHandler } from './platform/handlers/ameblo.js'
import { applePodcastsHandler } from './platform/handlers/applePodcasts.js'
import { arenaHandler } from './platform/handlers/arena.js'
import { art19Handler } from './platform/handlers/art19.js'
import { artstationHandler } from './platform/handlers/artstation.js'
import { audioboomHandler } from './platform/handlers/audioboom.js'
import { bearblogHandler } from './platform/handlers/bearblog.js'
import { behanceHandler } from './platform/handlers/behance.js'
import { bitchuteHandler } from './platform/handlers/bitchute.js'
import { blogspotHandler } from './platform/handlers/blogspot.js'
import { blueskyHandler } from './platform/handlers/bluesky.js'
import { bookwyrmHandler } from './platform/handlers/bookwyrm.js'
import { buttondownHandler } from './platform/handlers/buttondown.js'
import { buzzsproutHandler } from './platform/handlers/buzzsprout.js'
import { cnblogsHandler } from './platform/handlers/cnblogs.js'
import { confluenceHandler } from './platform/handlers/confluence.js'
import { csdnHandler } from './platform/handlers/csdn.js'
import { dailymotionHandler } from './platform/handlers/dailymotion.js'
import { deviantartHandler } from './platform/handlers/deviantart.js'
import { devtoHandler } from './platform/handlers/devto.js'
import { diasporaHandler } from './platform/handlers/diaspora.js'
import { discourseHandler } from './platform/handlers/discourse.js'
import { discuzHandler } from './platform/handlers/discuz.js'
import { doubanHandler } from './platform/handlers/douban.js'
import { dreamwidthHandler } from './platform/handlers/dreamwidth.js'
import { drupalHandler } from './platform/handlers/drupal.js'
import { exblogHandler } from './platform/handlers/exblog.js'
import { fc2Handler } from './platform/handlers/fc2.js'
import { firesideHandler } from './platform/handlers/fireside.js'
import { fluxbbHandler } from './platform/handlers/fluxbb.js'
import { friendicaHandler } from './platform/handlers/friendica.js'
import { funkwhaleHandler } from './platform/handlers/funkwhale.js'
import { ghostHandler } from './platform/handlers/ghost.js'
import { giteaHandler } from './platform/handlers/gitea.js'
import { githubHandler } from './platform/handlers/github.js'
import { githubGistHandler } from './platform/handlers/githubGist.js'
import { gitlabHandler } from './platform/handlers/gitlab.js'
import { goodreadsHandler } from './platform/handlers/goodreads.js'
import { gravHandler } from './platform/handlers/grav.js'
import { habrHandler } from './platform/handlers/habr.js'
import { hackernewsHandler } from './platform/handlers/hackernews.js'
import { hashnodeHandler } from './platform/handlers/hashnode.js'
import { hatenablogHandler } from './platform/handlers/hatenablog.js'
import { hearthisHandler } from './platform/handlers/hearthis.js'
import { heyWorldHandler } from './platform/handlers/heyWorld.js'
import { homelandHandler } from './platform/handlers/homeland.js'
import { hubspotHandler } from './platform/handlers/hubspot.js'
import { hubzillaHandler } from './platform/handlers/hubzilla.js'
import { insanejournalHandler } from './platform/handlers/insanejournal.js'
import { itchioHandler } from './platform/handlers/itchio.js'
import { jiraHandler } from './platform/handlers/jira.js'
import { joomlaHandler } from './platform/handlers/joomla.js'
import { kickstarterHandler } from './platform/handlers/kickstarter.js'
import { learnkuHandler } from './platform/handlers/learnku.js'
import { lemmyHandler } from './platform/handlers/lemmy.js'
import { letterboxdHandler } from './platform/handlers/letterboxd.js'
import { libsynHandler } from './platform/handlers/libsyn.js'
import { listedHandler } from './platform/handlers/listed.js'
import { livejournalHandler } from './platform/handlers/livejournal.js'
import { lobstersHandler } from './platform/handlers/lobsters.js'
import { mailchimpHandler } from './platform/handlers/mailchimp.js'
import { mastodonHandler } from './platform/handlers/mastodon.js'
import { mataroaHandler } from './platform/handlers/mataroa.js'
import { mediumHandler } from './platform/handlers/medium.js'
import { microblogHandler } from './platform/handlers/microblog.js'
import { misskeyHandler } from './platform/handlers/misskey.js'
import { mobilizonHandler } from './platform/handlers/mobilizon.js'
import { myanimelistHandler } from './platform/handlers/myanimelist.js'
import { naverBlogHandler } from './platform/handlers/naverBlog.js'
import { nebulaHandler } from './platform/handlers/nebula.js'
import { neocitiesHandler } from './platform/handlers/neocities.js'
import { nodebbHandler } from './platform/handlers/nodebb.js'
import { noteHandler } from './platform/handlers/note.js'
import { observableHandler } from './platform/handlers/observable.js'
import { odyseeHandler } from './platform/handlers/odysee.js'
import { omnystudioHandler } from './platform/handlers/omnystudio.js'
import { openstatusHandler } from './platform/handlers/openstatus.js'
import { pagecordHandler } from './platform/handlers/pagecord.js'
import { paragraphHandler } from './platform/handlers/paragraph.js'
import { peertubeHandler } from './platform/handlers/peertube.js'
import { phpbbHandler } from './platform/handlers/phpbb.js'
import { pikaHandler } from './platform/handlers/pika.js'
import { pinterestHandler } from './platform/handlers/pinterest.js'
import { pixelfedHandler } from './platform/handlers/pixelfed.js'
import { pleromaHandler } from './platform/handlers/pleroma.js'
import { podbeanHandler } from './platform/handlers/podbean.js'
import { podigeeHandler } from './platform/handlers/podigee.js'
import { podomaticHandler } from './platform/handlers/podomatic.js'
import { posthavenHandler } from './platform/handlers/posthaven.js'
import { postypeHandler } from './platform/handlers/postype.js'
import { powerpressHandler } from './platform/handlers/powerpress.js'
import { producthuntHandler } from './platform/handlers/producthunt.js'
import { proseHandler } from './platform/handlers/prose.js'
import { publiiHandler } from './platform/handlers/publii.js'
import { qiitaHandler } from './platform/handlers/qiita.js'
import { redditHandler } from './platform/handlers/reddit.js'
import { rssComHandler } from './platform/handlers/rssCom.js'
import { seesaaHandler } from './platform/handlers/seesaa.js'
import { shaarliHandler } from './platform/handlers/shaarli.js'
import { shopifyHandler } from './platform/handlers/shopify.js'
import { snacHandler } from './platform/handlers/snac.js'
import { soundcloudHandler } from './platform/handlers/soundcloud.js'
import { sourceforgeHandler } from './platform/handlers/sourceforge.js'
import { sourcehutHandler } from './platform/handlers/sourcehut.js'
import { spreakerHandler } from './platform/handlers/spreaker.js'
import { squarespaceHandler } from './platform/handlers/squarespace.js'
import { stackExchangeHandler } from './platform/handlers/stackExchange.js'
import { steamHandler } from './platform/handlers/steam.js'
import { substackHandler } from './platform/handlers/substack.js'
import { svbtleHandler } from './platform/handlers/svbtle.js'
import { syosetuHandler } from './platform/handlers/syosetu.js'
import { textpatternHandler } from './platform/handlers/textpattern.js'
import { tildesHandler } from './platform/handlers/tildes.js'
import { tistoryHandler } from './platform/handlers/tistory.js'
import { togetterHandler } from './platform/handlers/togetter.js'
import { transistorHandler } from './platform/handlers/transistor.js'
import { tumblrHandler } from './platform/handlers/tumblr.js'
import { v2exHandler } from './platform/handlers/v2ex.js'
import { velogHandler } from './platform/handlers/velog.js'
import { vimeoHandler } from './platform/handlers/vimeo.js'
import { weblogLolHandler } from './platform/handlers/weblogLol.js'
import { weeblyHandler } from './platform/handlers/weebly.js'
import { wikidotHandler } from './platform/handlers/wikidot.js'
import { wixHandler } from './platform/handlers/wix.js'
import { wordpressHandler } from './platform/handlers/wordpress.js'
import { wpengineHandler } from './platform/handlers/wpengine.js'
import { writeasHandler } from './platform/handlers/writeas.js'
import { writefreelyHandler } from './platform/handlers/writefreely.js'
import { xenforoHandler } from './platform/handlers/xenforo.js'
import { ximalayaHandler } from './platform/handlers/ximalaya.js'
import { youtubeHandler } from './platform/handlers/youtube.js'
import { zennHandler } from './platform/handlers/zenn.js'

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

// URIs to ignore when discovering feeds from anchor elements.
export const ignoredUris: Array<Pattern> = ['wp-json/oembed/', 'wp-json/wp/', wrappedFeedUrlRegex]

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
