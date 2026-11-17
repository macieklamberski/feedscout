import { getAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: newsroom.
// Handler needed for: audio, beat, events, images, news, press-releases, social, videos.

export type NewswireUrl =
  | { kind: 'newsroom'; newsroom: string }
  | { kind: 'beat'; newsroom: string; beat: string }
  | { kind: 'contentType'; newsroom: string; contentType: NewswireContentType }

type NewswireContentType = (typeof contentTypes)[number]

const domains = ['newswire.com']

const beatPathRegex = /^\/browse\/beat\/([a-z0-9-]+)\/?$/i
const contentTypePathRegex = /^\/browse\/([^/]+)\/?$/i

const contentTypes = ['news', 'pr', 'social', 'image', 'video', 'audio', 'event'] as const

const feeds = definePlatformFeeds(
  'newswire',
  [
    { key: 'beat', main: '{scheme}://{host}/browse/rss/beat/{beat}' },
    { key: 'news', main: '{scheme}://{host}/browse/rss/news' },
    { key: 'press-releases', main: '{scheme}://{host}/browse/rss/pr' },
    { key: 'social', main: '{scheme}://{host}/browse/rss/social' },
    { key: 'images', main: '{scheme}://{host}/browse/rss/image' },
    { key: 'videos', main: '{scheme}://{host}/browse/rss/video' },
    { key: 'audio', main: '{scheme}://{host}/browse/rss/audio' },
    { key: 'events', main: '{scheme}://{host}/browse/rss/event' },
    // The social posts from one network, which no newsroom page names.
    { key: 'social-network', main: '{scheme}://{host}/browse/rss/social/{network}' },
    { key: 'newsroom', main: '{scheme}://{host}/browse/rss' },
  ],
  { hosts: { tenants: domains } },
)

export const parseNewswireUrl = (url: string): NewswireUrl | undefined => {
  const pathname = parseUrl(url)?.pathname
  const newsroom = getTenantSubdomain(url, domains)

  if (!pathname || !newsroom) {
    return
  }

  const beat = pathname.match(beatPathRegex)?.[1]

  if (beat) {
    return { kind: 'beat', newsroom, beat }
  }

  const contentType = getAnyOf(pathname.match(contentTypePathRegex)?.[1], contentTypes)

  if (contentType) {
    return { kind: 'contentType', newsroom, contentType }
  }

  return { kind: 'newsroom', newsroom }
}

export const newswireHandler: PlatformHandler = {
  match: (url) => {
    return parseNewswireUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNewswireUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // The newsroom and its content type feeds need no value from the page, so every page builds
    // them after its own feeds. A made-up beat redirects to the newsroom's /browse page, which
    // validation drops.
    if (parsed.kind === 'beat') {
      return [
        page.getFeedEntry('beat', { beat: parsed.beat }),
        page.getFeedEntry('newsroom'),
        page.getFeedEntry('news'),
        page.getFeedEntry('press-releases'),
        page.getFeedEntry('social'),
        page.getFeedEntry('images'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('audio'),
        page.getFeedEntry('events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'news') {
      return [
        page.getFeedEntry('news'),
        page.getFeedEntry('newsroom'),
        page.getFeedEntry('press-releases'),
        page.getFeedEntry('social'),
        page.getFeedEntry('images'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('audio'),
        page.getFeedEntry('events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'pr') {
      return [
        page.getFeedEntry('press-releases'),
        page.getFeedEntry('newsroom'),
        page.getFeedEntry('news'),
        page.getFeedEntry('social'),
        page.getFeedEntry('images'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('audio'),
        page.getFeedEntry('events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'social') {
      return [
        page.getFeedEntry('social'),
        page.getFeedEntry('newsroom'),
        page.getFeedEntry('news'),
        page.getFeedEntry('press-releases'),
        page.getFeedEntry('images'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('audio'),
        page.getFeedEntry('events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'image') {
      return [
        page.getFeedEntry('images'),
        page.getFeedEntry('newsroom'),
        page.getFeedEntry('news'),
        page.getFeedEntry('press-releases'),
        page.getFeedEntry('social'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('audio'),
        page.getFeedEntry('events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'video') {
      return [
        page.getFeedEntry('videos'),
        page.getFeedEntry('newsroom'),
        page.getFeedEntry('news'),
        page.getFeedEntry('press-releases'),
        page.getFeedEntry('social'),
        page.getFeedEntry('images'),
        page.getFeedEntry('audio'),
        page.getFeedEntry('events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'audio') {
      return [
        page.getFeedEntry('audio'),
        page.getFeedEntry('newsroom'),
        page.getFeedEntry('news'),
        page.getFeedEntry('press-releases'),
        page.getFeedEntry('social'),
        page.getFeedEntry('images'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'event') {
      return [
        page.getFeedEntry('events'),
        page.getFeedEntry('newsroom'),
        page.getFeedEntry('news'),
        page.getFeedEntry('press-releases'),
        page.getFeedEntry('social'),
        page.getFeedEntry('images'),
        page.getFeedEntry('videos'),
        page.getFeedEntry('audio'),
      ]
    }

    return [
      page.getFeedEntry('newsroom'),
      page.getFeedEntry('news'),
      page.getFeedEntry('press-releases'),
      page.getFeedEntry('social'),
      page.getFeedEntry('images'),
      page.getFeedEntry('videos'),
      page.getFeedEntry('audio'),
      page.getFeedEntry('events'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
