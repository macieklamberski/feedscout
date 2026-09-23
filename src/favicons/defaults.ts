import { omitEmpty } from 'trousse'
import type { LinkSelector } from '../common/types.js'
import type { FeedMethodOptions } from '../common/uris/feed/types.js'
import type { GuessMethodOptions } from '../common/uris/guess/types.js'
import type { HeadersMethodOptions } from '../common/uris/headers/types.js'
import type { HtmlMethodOptions } from '../common/uris/html/types.js'
import type { PlatformMethodOptions } from '../common/uris/platform/types.js'
import { amebloHandler } from './platform/handlers/ameblo.js'
import { arenaEnricher, arenaHandler } from './platform/handlers/arena.js'
import { behanceHandler } from './platform/handlers/behance.js'
import { bitchuteHandler } from './platform/handlers/bitchute.js'
import { blueskyEnricher, blueskyHandler } from './platform/handlers/bluesky.js'
import { bookwyrmEnricher, bookwyrmHandler } from './platform/handlers/bookwyrm.js'
import { deviantartHandler } from './platform/handlers/deviantart.js'
import { devtoEnricher, devtoHandler } from './platform/handlers/devto.js'
import { flickrHandler } from './platform/handlers/flickr.js'
import { giteaHandler } from './platform/handlers/gitea.js'
import { githubHandler } from './platform/handlers/github.js'
import { githubGistHandler } from './platform/handlers/githubGist.js'
import { gitlabEnricher, gitlabHandler } from './platform/handlers/gitlab.js'
import { habrHandler } from './platform/handlers/habr.js'
import { letterboxdHandler } from './platform/handlers/letterboxd.js'
import { lobstersHandler } from './platform/handlers/lobsters.js'
import { mastodonEnricher, mastodonHandler } from './platform/handlers/mastodon.js'
import { microblogHandler } from './platform/handlers/microblog.js'
import { naverBlogEnricher, naverBlogHandler } from './platform/handlers/naverBlog.js'
import { nebulaEnricher, nebulaHandler } from './platform/handlers/nebula.js'
import { noteEnricher, noteHandler } from './platform/handlers/note.js'
import { peertubeEnricher, peertubeHandler } from './platform/handlers/peertube.js'
import { pinterestEnricher, pinterestHandler } from './platform/handlers/pinterest.js'
import { pixelfedEnricher, pixelfedHandler } from './platform/handlers/pixelfed.js'
import { producthuntHandler } from './platform/handlers/producthunt.js'
import { redditEnricher, redditHandler } from './platform/handlers/reddit.js'
import { soundcloudHandler } from './platform/handlers/soundcloud.js'
import { sourceforgeHandler } from './platform/handlers/sourceforge.js'
import { sourcehutHandler } from './platform/handlers/sourcehut.js'
import { steamHandler } from './platform/handlers/steam.js'
import { togetterHandler } from './platform/handlers/togetter.js'
import { tumblrHandler } from './platform/handlers/tumblr.js'
import { youtubeHandler } from './platform/handlers/youtube.js'
import { zennHandler } from './platform/handlers/zenn.js'
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
    bitchuteHandler,
    behanceHandler,
    arenaHandler,
    amebloHandler,
    giteaHandler,
    githubHandler,
    githubGistHandler,
    gitlabHandler,
    letterboxdHandler,
    habrHandler,
    mastodonHandler,
    microblogHandler,
    pinterestHandler,
    nebulaHandler,
    naverBlogHandler,
    producthuntHandler,
    noteHandler,
    peertubeHandler,
    pixelfedHandler,
    blueskyHandler,
    bookwyrmHandler,
    redditHandler,
    soundcloudHandler,
    tumblrHandler,
    youtubeHandler,
    zennHandler,
    lobstersHandler,
    sourceforgeHandler,
    steamHandler,
    togetterHandler,
    sourcehutHandler,
    deviantartHandler,
    devtoHandler,
    flickrHandler,
  ],
}

export const defaultFaviconEnrichers: Array<FaviconEnricher> = [
  arenaEnricher,
  mastodonEnricher,
  pinterestEnricher,
  noteEnricher,
  pixelfedEnricher,
  blueskyEnricher,
  bookwyrmEnricher,
  redditEnricher,
  gitlabEnricher,
  devtoEnricher,
  nebulaEnricher,
  naverBlogEnricher,
  peertubeEnricher,
]
