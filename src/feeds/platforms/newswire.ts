import { newswire } from 'feedintel'
import { getAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
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

const domains = newswire.hosts.tenants

const contentTypes = ['news', 'pr', 'social', 'image', 'video', 'audio', 'event'] as const

const feeds = withHintLabels(newswire.feeds)

export const parseNewswireUrl = (url: string): NewswireUrl | undefined => {
  const page = newswire.pages.read(url)
  const newsroom = getTenantSubdomain(url, domains)

  if (!page || !newsroom) {
    return
  }

  if (page.key === 'beat') {
    return { kind: 'beat', newsroom, beat: page.params.beat }
  }

  const contentType = getAnyOf(page.params.contentType, contentTypes)

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
