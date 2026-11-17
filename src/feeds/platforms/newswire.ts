import { getAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers newsroom (guess, html), partly covers beat, contentType.

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
  [
    { key: 'newswire:beat', main: '{scheme}://{host}/browse/rss/beat/{beat}' },
    { key: 'newswire:news', main: '{scheme}://{host}/browse/rss/news' },
    { key: 'newswire:press-releases', main: '{scheme}://{host}/browse/rss/pr' },
    { key: 'newswire:social', main: '{scheme}://{host}/browse/rss/social' },
    { key: 'newswire:images', main: '{scheme}://{host}/browse/rss/image' },
    { key: 'newswire:videos', main: '{scheme}://{host}/browse/rss/video' },
    { key: 'newswire:audio', main: '{scheme}://{host}/browse/rss/audio' },
    { key: 'newswire:events', main: '{scheme}://{host}/browse/rss/event' },
    // The social posts from one network, which no newsroom page names.
    { key: 'newswire:social-network', main: '{scheme}://{host}/browse/rss/social/{network}' },
    { key: 'newswire:newsroom', main: '{scheme}://{host}/browse/rss' },
  ],
  { domains },
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
        page.getFeedEntry('newswire:beat', { beat: parsed.beat }),
        page.getFeedEntry('newswire:newsroom'),
        page.getFeedEntry('newswire:news'),
        page.getFeedEntry('newswire:press-releases'),
        page.getFeedEntry('newswire:social'),
        page.getFeedEntry('newswire:images'),
        page.getFeedEntry('newswire:videos'),
        page.getFeedEntry('newswire:audio'),
        page.getFeedEntry('newswire:events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'news') {
      return [
        page.getFeedEntry('newswire:news'),
        page.getFeedEntry('newswire:newsroom'),
        page.getFeedEntry('newswire:press-releases'),
        page.getFeedEntry('newswire:social'),
        page.getFeedEntry('newswire:images'),
        page.getFeedEntry('newswire:videos'),
        page.getFeedEntry('newswire:audio'),
        page.getFeedEntry('newswire:events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'pr') {
      return [
        page.getFeedEntry('newswire:press-releases'),
        page.getFeedEntry('newswire:newsroom'),
        page.getFeedEntry('newswire:news'),
        page.getFeedEntry('newswire:social'),
        page.getFeedEntry('newswire:images'),
        page.getFeedEntry('newswire:videos'),
        page.getFeedEntry('newswire:audio'),
        page.getFeedEntry('newswire:events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'social') {
      return [
        page.getFeedEntry('newswire:social'),
        page.getFeedEntry('newswire:newsroom'),
        page.getFeedEntry('newswire:news'),
        page.getFeedEntry('newswire:press-releases'),
        page.getFeedEntry('newswire:images'),
        page.getFeedEntry('newswire:videos'),
        page.getFeedEntry('newswire:audio'),
        page.getFeedEntry('newswire:events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'image') {
      return [
        page.getFeedEntry('newswire:images'),
        page.getFeedEntry('newswire:newsroom'),
        page.getFeedEntry('newswire:news'),
        page.getFeedEntry('newswire:press-releases'),
        page.getFeedEntry('newswire:social'),
        page.getFeedEntry('newswire:videos'),
        page.getFeedEntry('newswire:audio'),
        page.getFeedEntry('newswire:events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'video') {
      return [
        page.getFeedEntry('newswire:videos'),
        page.getFeedEntry('newswire:newsroom'),
        page.getFeedEntry('newswire:news'),
        page.getFeedEntry('newswire:press-releases'),
        page.getFeedEntry('newswire:social'),
        page.getFeedEntry('newswire:images'),
        page.getFeedEntry('newswire:audio'),
        page.getFeedEntry('newswire:events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'audio') {
      return [
        page.getFeedEntry('newswire:audio'),
        page.getFeedEntry('newswire:newsroom'),
        page.getFeedEntry('newswire:news'),
        page.getFeedEntry('newswire:press-releases'),
        page.getFeedEntry('newswire:social'),
        page.getFeedEntry('newswire:images'),
        page.getFeedEntry('newswire:videos'),
        page.getFeedEntry('newswire:events'),
      ]
    }

    if (parsed.kind === 'contentType' && parsed.contentType === 'event') {
      return [
        page.getFeedEntry('newswire:events'),
        page.getFeedEntry('newswire:newsroom'),
        page.getFeedEntry('newswire:news'),
        page.getFeedEntry('newswire:press-releases'),
        page.getFeedEntry('newswire:social'),
        page.getFeedEntry('newswire:images'),
        page.getFeedEntry('newswire:videos'),
        page.getFeedEntry('newswire:audio'),
      ]
    }

    return [
      page.getFeedEntry('newswire:newsroom'),
      page.getFeedEntry('newswire:news'),
      page.getFeedEntry('newswire:press-releases'),
      page.getFeedEntry('newswire:social'),
      page.getFeedEntry('newswire:images'),
      page.getFeedEntry('newswire:videos'),
      page.getFeedEntry('newswire:audio'),
      page.getFeedEntry('newswire:events'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
