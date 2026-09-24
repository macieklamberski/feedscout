import { omitEmpty } from 'trousse'
import type { LinkSelector } from '../common/types.js'
import type { FeedMethodOptions } from '../common/uris/feed/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { amebloHandler } from './platforms/ameblo.js'
import { arenaEnricher, arenaHandler } from './platforms/arena.js'
import { behanceHandler } from './platforms/behance.js'
import { bitchuteHandler } from './platforms/bitchute.js'
import { blueskyEnricher, blueskyHandler } from './platforms/bluesky.js'
import { bookwyrmEnricher, bookwyrmHandler } from './platforms/bookwyrm.js'
import { dailymotionEnricher, dailymotionHandler } from './platforms/dailymotion.js'
import { deviantartHandler } from './platforms/deviantart.js'
import { devtoEnricher, devtoHandler } from './platforms/devto.js'
import { flickrHandler } from './platforms/flickr.js'
import { giteaHandler } from './platforms/gitea.js'
import { githubHandler } from './platforms/github.js'
import { githubGistHandler } from './platforms/githubGist.js'
import { gitlabEnricher, gitlabHandler } from './platforms/gitlab.js'
import { habrHandler } from './platforms/habr.js'
import { hatenaBookmarkEnricher, hatenaBookmarkHandler } from './platforms/hatenaBookmark.js'
import { letterboxdEnricher, letterboxdHandler } from './platforms/letterboxd.js'
import { lobstersHandler } from './platforms/lobsters.js'
import { mastodonEnricher, mastodonHandler } from './platforms/mastodon.js'
import { mediumEnricher, mediumHandler } from './platforms/medium.js'
import { microblogHandler } from './platforms/microblog.js'
import { myanimelistEnricher, myanimelistHandler } from './platforms/myanimelist.js'
import { naverBlogEnricher, naverBlogHandler } from './platforms/naverBlog.js'
import { nebulaEnricher, nebulaHandler } from './platforms/nebula.js'
import { noteEnricher, noteHandler } from './platforms/note.js'
import { observableEnricher, observableHandler } from './platforms/observable.js'
import { odyseeEnricher, odyseeHandler } from './platforms/odysee.js'
import { peertubeEnricher, peertubeHandler } from './platforms/peertube.js'
import { pinterestEnricher, pinterestHandler } from './platforms/pinterest.js'
import { pixelfedEnricher, pixelfedHandler } from './platforms/pixelfed.js'
import { producthuntHandler } from './platforms/producthunt.js'
import { redditEnricher, redditHandler } from './platforms/reddit.js'
import { soundcloudHandler } from './platforms/soundcloud.js'
import { sourceforgeHandler } from './platforms/sourceforge.js'
import { sourcehutEnricher, sourcehutHandler } from './platforms/sourcehut.js'
import { steamEnricher, steamHandler } from './platforms/steam.js'
import { togetterHandler } from './platforms/togetter.js'
import { tumblrHandler } from './platforms/tumblr.js'
import { velogEnricher, velogHandler } from './platforms/velog.js'
import { youtubeHandler } from './platforms/youtube.js'
import { zennHandler } from './platforms/zenn.js'
import type { FaviconEnricher } from './types.js'

export const defaultIconRels = [
  'icon',
  'shortcut',
  'alternate icon',
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

// Podcast artwork in `itunes:image` must be square, which RSS `<image>` is not:
// that one is a logo up to 144 by 400 pixels.
// See: https://help.apple.com/itc/podcasts_connect/en.lproj/static.html.
export const defaultFeedOptions: FeedMethodOptions = {
  extractUrls: ({ format, feed }) => {
    if (format === 'atom') {
      return omitEmpty([feed.icon, feed.itunes?.image])
    }

    if (format === 'rss') {
      return omitEmpty([feed.itunes?.image])
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
    amebloHandler,
    arenaHandler,
    behanceHandler,
    bitchuteHandler,
    blueskyHandler,
    bookwyrmHandler,
    dailymotionHandler,
    deviantartHandler,
    devtoHandler,
    flickrHandler,
    giteaHandler,
    githubHandler,
    githubGistHandler,
    gitlabHandler,
    habrHandler,
    hatenaBookmarkHandler,
    letterboxdHandler,
    lobstersHandler,
    mastodonHandler,
    mediumHandler,
    microblogHandler,
    myanimelistHandler,
    naverBlogHandler,
    nebulaHandler,
    noteHandler,
    observableHandler,
    odyseeHandler,
    peertubeHandler,
    pinterestHandler,
    pixelfedHandler,
    producthuntHandler,
    redditHandler,
    soundcloudHandler,
    sourceforgeHandler,
    sourcehutHandler,
    steamHandler,
    togetterHandler,
    tumblrHandler,
    velogHandler,
    youtubeHandler,
    zennHandler,
  ],
}

export const defaultFaviconEnrichers: Array<FaviconEnricher> = [
  arenaEnricher,
  blueskyEnricher,
  bookwyrmEnricher,
  dailymotionEnricher,
  devtoEnricher,
  gitlabEnricher,
  hatenaBookmarkEnricher,
  letterboxdEnricher,
  mastodonEnricher,
  mediumEnricher,
  myanimelistEnricher,
  naverBlogEnricher,
  nebulaEnricher,
  noteEnricher,
  observableEnricher,
  odyseeEnricher,
  peertubeEnricher,
  pinterestEnricher,
  pixelfedEnricher,
  redditEnricher,
  sourcehutEnricher,
  steamEnricher,
  velogEnricher,
]
