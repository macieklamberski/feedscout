import { newswire } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: newsroom.
// Handler needed for: audio, beat, events, images, news, press-releases, social, videos.

export type NewswireUrl =
  | { kind: 'newsroom'; newsroom: string }
  | { kind: 'beat'; newsroom: string; beat: string }
  | { kind: 'contentType'; newsroom: string; contentType: string }

const feeds = withHintLabels(newswire.feeds)

export const parseNewswireUrl = (url: string): NewswireUrl | undefined => {
  const page = newswire.pages.read(url)

  if (!page) {
    return
  }

  const { newsroom, beat } = page.params

  if (page.key === 'beat') {
    return { kind: 'beat', newsroom, beat }
  }

  if (page.key === 'newsroom') {
    return { kind: 'newsroom', newsroom }
  }

  // Every other page lists one content type, the key of its row.
  return { kind: 'contentType', newsroom, contentType: page.key }
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
