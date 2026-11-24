import { feedMimeTypes, genericFeedMimeTypes } from 'trousse'
import type { LinkSelector, Pattern, UriEntry } from '../common/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { acastHandler } from './platforms/acast.js'
import { acomicsHandler } from './platforms/acomics.js'
import { aladinHandler } from './platforms/aladin.js'
import { alloforumHandler } from './platforms/alloforum.js'
import { amebloHandler } from './platforms/ameblo.js'
import { applePodcastsHandler } from './platforms/applePodcasts.js'
import { art19Handler } from './platforms/art19.js'
import { atwikiHandler } from './platforms/atwiki.js'
import { atyponHandler } from './platforms/atypon.js'
import { audioboomHandler } from './platforms/audioboom.js'
import { aushaHandler } from './platforms/ausha.js'
import { bangumiHandler } from './platforms/bangumi.js'
import { bearblogHandler } from './platforms/bearblog.js'
import { behanceHandler } from './platforms/behance.js'
import { bigCartelHandler } from './platforms/bigCartel.js'
import { bigcommerceHandler } from './platforms/bigcommerce.js'
import { bingHandler } from './platforms/bing.js'
import { bitchuteHandler } from './platforms/bitchute.js'
import { blogaliaHandler } from './platforms/blogalia.js'
import { bloggangHandler } from './platforms/bloggang.js'
import { bloggoHandler } from './platforms/bloggo.js'
import { blogHuHandler } from './platforms/blogHu.js'
import { blogiaHandler } from './platforms/blogia.js'
import { blogspotHandler } from './platforms/blogspot.js'
import { bubblelifeHandler } from './platforms/bubblelife.js'
import { buttondownHandler } from './platforms/buttondown.js'
import { buzzsproutHandler } from './platforms/buzzsprout.js'
import { canalblogHandler } from './platforms/canalblog.js'
import { canpanHandler } from './platforms/canpan.js'
import { captivateHandler } from './platforms/captivate.js'
import { castopodHandler } from './platforms/castopod.js'
import { castosHandler } from './platforms/castos.js'
import { chambermasterHandler } from './platforms/chambermaster.js'
import { civicplusHandler } from './platforms/civicplus.js'
import { cnblogsHandler } from './platforms/cnblogs.js'
import { colorMeShopHandler } from './platforms/colorMeShop.js'
import { comicfuryHandler } from './platforms/comicfury.js'
import { cppblogHandler } from './platforms/cppblog.js'
import { cratesIoHandler } from './platforms/cratesIo.js'
import { csdnHandler } from './platforms/csdn.js'
import { dailymotionHandler } from './platforms/dailymotion.js'
import { dasaugeHandler } from './platforms/dasauge.js'
import { deviantartHandler } from './platforms/deviantart.js'
import { devtoHandler } from './platforms/devto.js'
import { doubanHandler } from './platforms/douban.js'
import { drupalHandler } from './platforms/drupal.js'
import { duckWebcomicsHandler } from './platforms/duckWebcomics.js'
import { eklablogHandler } from './platforms/eklablog.js'
import { estrankyHandler } from './platforms/estranky.js'
import { exblogHandler } from './platforms/exblog.js'
import { fc2Handler } from './platforms/fc2.js'
import { firesideHandler } from './platforms/fireside.js'
import { firstoryHandler } from './platforms/firstory.js'
import { flickrHandler } from './platforms/flickr.js'
import { fluxbbHandler } from './platforms/fluxbb.js'
import { forumotionHandler } from './platforms/forumotion.js'
import { friendicaHandler } from './platforms/friendica.js'
import { gcsWebHandler } from './platforms/gcsWeb.js'
import { ghostHandler } from './platforms/ghost.js'
import { giteaHandler } from './platforms/gitea.js'
import { githubHandler } from './platforms/github.js'
import { gitlabHandler } from './platforms/gitlab.js'
import { goopeHandler } from './platforms/goope.js'
import { greasyForkHandler } from './platforms/greasyFork.js'
import { habrHandler } from './platforms/habr.js'
import { hashnodeHandler } from './platforms/hashnode.js'
import { hatenaAntennaHandler } from './platforms/hatenaAntenna.js'
import { hatenablogHandler } from './platforms/hatenablog.js'
import { hautetfortHandler } from './platforms/hautetfort.js'
import { hearthisHandler } from './platforms/hearthis.js'
import { insanejournalHandler } from './platforms/insanejournal.js'
import { instatusHandler } from './platforms/instatus.js'
import { internetArchiveHandler } from './platforms/internetArchive.js'
import { isProgrammerHandler } from './platforms/isProgrammer.js'
import { itchioHandler } from './platforms/itchio.js'
import { ivooxHandler } from './platforms/ivoox.js'
import { jellypodHandler } from './platforms/jellypod.js'
import { jimdoHandler } from './platforms/jimdo.js'
import { jinboHandler } from './platforms/jinbo.js'
import { jiraHandler } from './platforms/jira.js'
import { kktixHandler } from './platforms/kktix.js'
import { lagetHandler } from './platforms/laget.js'
import { launchpadHandler } from './platforms/launchpad.js'
import { legistarHandler } from './platforms/legistar.js'
import { letterboxdHandler } from './platforms/letterboxd.js'
import { librivoxHandler } from './platforms/librivox.js'
import { libsynHandler } from './platforms/libsyn.js'
import { listedHandler } from './platforms/listed.js'
import { livedoorBlogHandler } from './platforms/livedoorBlog.js'
import { mailArchiveHandler } from './platforms/mailArchive.js'
import { mailchimpHandler } from './platforms/mailchimp.js'
import { mastodonHandler } from './platforms/mastodon.js'
import { mediumHandler } from './platforms/medium.js'
import { megaphoneHandler } from './platforms/megaphone.js'
import { microblogHandler } from './platforms/microblog.js'
import { misskeyHandler } from './platforms/misskey.js'
import { myanimelistHandler } from './platforms/myanimelist.js'
import { mybbHandler } from './platforms/mybb.js'
import { naverBlogHandler } from './platforms/naverBlog.js'
import { neocitiesHandler } from './platforms/neocities.js'
import { nethouseHandler } from './platforms/nethouse.js'
import { newswireHandler } from './platforms/newswire.js'
import { niconicoHandler } from './platforms/niconico.js'
import { ningHandler } from './platforms/ning.js'
import { noteHandler } from './platforms/note.js'
import { noticeableHandler } from './platforms/noticeable.js'
import { observableHandler } from './platforms/observable.js'
import { ocnkHandler } from './platforms/ocnk.js'
import { odooHandler } from './platforms/odoo.js'
import { odyseeHandler } from './platforms/odysee.js'
import { ojsHandler } from './platforms/ojs.js'
import { omnystudioHandler } from './platforms/omnystudio.js'
import { openeditionHandler } from './platforms/openedition.js'
import { overblogHandler } from './platforms/overblog.js'
import { paragraphHandler } from './platforms/paragraph.js'
import { parsiblogHandler } from './platforms/parsiblog.js'
import { pchomeHandler } from './platforms/pchome.js'
import { peertubeHandler } from './platforms/peertube.js'
import { phpbbHandler } from './platforms/phpbb.js'
import { pinterestHandler } from './platforms/pinterest.js'
import { podbeanHandler } from './platforms/podbean.js'
import { podcloudHandler } from './platforms/podcloud.js'
import { podigeeHandler } from './platforms/podigee.js'
import { podloveHandler } from './platforms/podlove.js'
import { postachioHandler } from './platforms/postachio.js'
import { posthavenHandler } from './platforms/posthaven.js'
import { powerpressHandler } from './platforms/powerpress.js'
import { prlogHandler } from './platforms/prlog.js'
import { proboardsHandler } from './platforms/proboards.js'
import { promodjHandler } from './platforms/promodj.js'
import { publicInboxHandler } from './platforms/publicInbox.js'
import { purotHandler } from './platforms/purot.js'
import { pypiHandler } from './platforms/pypi.js'
import { qiitaHandler } from './platforms/qiita.js'
import { rakutenBlogHandler } from './platforms/rakutenBlog.js'
import { redcircleHandler } from './platforms/redcircle.js'
import { redditHandler } from './platforms/reddit.js'
import { reformalHandler } from './platforms/reformal.js'
import { rssComHandler } from './platforms/rssCom.js'
import { rubygemsHandler } from './platforms/rubygems.js'
import { sakuraBlogHandler } from './platforms/sakuraBlog.js'
import { seesaaHandler } from './platforms/seesaa.js'
import { sermonNetHandler } from './platforms/sermonNet.js'
import { shaarliHandler } from './platforms/shaarli.js'
import { shinobiHandler } from './platforms/shinobi.js'
import { shopifyHandler } from './platforms/shopify.js'
import { skycmsHandler } from './platforms/skycms.js'
import { smeBlogHandler } from './platforms/smeBlog.js'
import { smfHandler } from './platforms/smf.js'
import { soundcloudHandler } from './platforms/soundcloud.js'
import { soundonHandler } from './platforms/soundon.js'
import { sourcehutHandler } from './platforms/sourcehut.js'
import { sportadminHandler } from './platforms/sportadmin.js'
import { sportsregionsHandler } from './platforms/sportsregions.js'
import { spotifyForCreatorsHandler } from './platforms/spotifyForCreators.js'
import { spreakerHandler } from './platforms/spreaker.js'
import { stackExchangeHandler } from './platforms/stackExchange.js'
import { statuspageHandler } from './platforms/statuspage.js'
import { steamHandler } from './platforms/steam.js'
import { substackHandler } from './platforms/substack.js'
import { svbtleHandler } from './platforms/svbtle.js'
import { sverigesRadioHandler } from './platforms/sverigesRadio.js'
import { teletypeHandler } from './platforms/teletype.js'
import { textpatternHandler } from './platforms/textpattern.js'
import { tischtennisliveHandler } from './platforms/tischtennislive.js'
import { tistoryHandler } from './platforms/tistory.js'
import { transistorHandler } from './platforms/transistor.js'
import { travellerspointHandler } from './platforms/travellerspoint.js'
import { tumblrHandler } from './platforms/tumblr.js'
import { twodayHandler } from './platforms/twoday.js'
import { ucozHandler } from './platforms/ucoz.js'
import { velogHandler } from './platforms/velog.js'
import { viablogaHandler } from './platforms/viabloga.js'
import { vimeoHandler } from './platforms/vimeo.js'
import { webnodeHandler } from './platforms/webnode.js'
import { webtoonsHandler } from './platforms/webtoons.js'
import { weeblyHandler } from './platforms/weebly.js'
import { wikidotHandler } from './platforms/wikidot.js'
import { wildApricotHandler } from './platforms/wildApricot.js'
import { wixHandler } from './platforms/wix.js'
import { wordpressHandler } from './platforms/wordpress.js'
import { wpengineHandler } from './platforms/wpengine.js'
import { ximalayaHandler } from './platforms/ximalaya.js'
import { youtubeHandler } from './platforms/youtube.js'
import { zennHandler } from './platforms/zenn.js'

// text/plain names no feed format, so a link of that type is no feed hint.
export const mimeTypes = [...feedMimeTypes, ...genericFeedMimeTypes]
  .map((type) => type.mime)
  .filter((mime) => mime !== 'text/plain')

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
  ['/comments/feed/atom/', '?feed=comments-atom'],
  '/feeds/posts/default',
  '/feeds/posts/default?alt=rss',
  '/feeds/comments/default',
]

// Subscribe/share endpoints (Add to My Yahoo, Netvibes, Google Podcasts, AddThis, affiliate
// redirectors, …) pass the real feed URL as a query parameter, e.g. ?url=http…, ?feed=aHR0c…
// (base64 of "http"). They would otherwise match on their "Subscribe"/"RSS" link text and waste
// a fetch, so ignore any anchor whose href carries an embedded URL.
const wrappedFeedUrlRegex = /[?&][^=&?]*=(https?:|https?%3a|aHR0c)/i

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
    acomicsHandler,
    aladinHandler,
    alloforumHandler,
    amebloHandler,
    applePodcastsHandler,
    art19Handler,
    atwikiHandler,
    atyponHandler,
    audioboomHandler,
    aushaHandler,
    bangumiHandler,
    bearblogHandler,
    behanceHandler,
    bigCartelHandler,
    bigcommerceHandler,
    bingHandler,
    bitchuteHandler,
    blogHuHandler,
    blogaliaHandler,
    bloggangHandler,
    bloggoHandler,
    blogiaHandler,
    blogspotHandler,
    bubblelifeHandler,
    buttondownHandler,
    buzzsproutHandler,
    canalblogHandler,
    canpanHandler,
    captivateHandler,
    castopodHandler,
    castosHandler,
    chambermasterHandler,
    civicplusHandler,
    cnblogsHandler,
    colorMeShopHandler,
    comicfuryHandler,
    cppblogHandler,
    cratesIoHandler,
    csdnHandler,
    dailymotionHandler,
    dasaugeHandler,
    deviantartHandler,
    devtoHandler,
    doubanHandler,
    drupalHandler,
    duckWebcomicsHandler,
    eklablogHandler,
    estrankyHandler,
    exblogHandler,
    fc2Handler,
    firesideHandler,
    firstoryHandler,
    flickrHandler,
    fluxbbHandler,
    forumotionHandler,
    friendicaHandler,
    gcsWebHandler,
    ghostHandler,
    giteaHandler,
    githubHandler,
    gitlabHandler,
    goopeHandler,
    greasyForkHandler,
    habrHandler,
    hashnodeHandler,
    hatenaAntennaHandler,
    hatenablogHandler,
    hautetfortHandler,
    hearthisHandler,
    insanejournalHandler,
    instatusHandler,
    internetArchiveHandler,
    isProgrammerHandler,
    itchioHandler,
    ivooxHandler,
    jellypodHandler,
    jimdoHandler,
    jinboHandler,
    jiraHandler,
    kktixHandler,
    lagetHandler,
    launchpadHandler,
    legistarHandler,
    letterboxdHandler,
    librivoxHandler,
    libsynHandler,
    listedHandler,
    livedoorBlogHandler,
    mailArchiveHandler,
    mailchimpHandler,
    mastodonHandler,
    mediumHandler,
    megaphoneHandler,
    microblogHandler,
    misskeyHandler,
    myanimelistHandler,
    mybbHandler,
    naverBlogHandler,
    neocitiesHandler,
    nethouseHandler,
    newswireHandler,
    niconicoHandler,
    ningHandler,
    noteHandler,
    noticeableHandler,
    observableHandler,
    ocnkHandler,
    odooHandler,
    odyseeHandler,
    ojsHandler,
    omnystudioHandler,
    openeditionHandler,
    overblogHandler,
    paragraphHandler,
    parsiblogHandler,
    pchomeHandler,
    peertubeHandler,
    phpbbHandler,
    pinterestHandler,
    podbeanHandler,
    podcloudHandler,
    podigeeHandler,
    podloveHandler,
    postachioHandler,
    posthavenHandler,
    powerpressHandler,
    prlogHandler,
    proboardsHandler,
    promodjHandler,
    publicInboxHandler,
    purotHandler,
    pypiHandler,
    qiitaHandler,
    rakutenBlogHandler,
    redcircleHandler,
    redditHandler,
    reformalHandler,
    rssComHandler,
    rubygemsHandler,
    sakuraBlogHandler,
    seesaaHandler,
    sermonNetHandler,
    shaarliHandler,
    shinobiHandler,
    shopifyHandler,
    skycmsHandler,
    smeBlogHandler,
    smfHandler,
    soundcloudHandler,
    soundonHandler,
    sourcehutHandler,
    sportadminHandler,
    sportsregionsHandler,
    spotifyForCreatorsHandler,
    spreakerHandler,
    stackExchangeHandler,
    statuspageHandler,
    steamHandler,
    substackHandler,
    svbtleHandler,
    sverigesRadioHandler,
    teletypeHandler,
    textpatternHandler,
    tischtennisliveHandler,
    tistoryHandler,
    transistorHandler,
    travellerspointHandler,
    tumblrHandler,
    twodayHandler,
    ucozHandler,
    velogHandler,
    viablogaHandler,
    vimeoHandler,
    webnodeHandler,
    webtoonsHandler,
    weeblyHandler,
    wikidotHandler,
    wildApricotHandler,
    wixHandler,
    wordpressHandler,
    wpengineHandler,
    ximalayaHandler,
    youtubeHandler,
    zennHandler,
  ],
}
