import { flickr, isFlickrNsid } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: faves, group-discuss, group-geo, group-pool, photos.
// Handler needed for: forum, group-photos, recent, recent-geo, tag.

export type FlickrUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'photostream'; userId: string }
  | { kind: 'favorites'; userId: string }
  | { kind: 'albums'; userId: string }
  | { kind: 'galleries'; userId: string }
  | { kind: 'album'; userId: string; set: string }
  | { kind: 'userTag'; userId: string; tag: string }
  | { kind: 'subpage'; userId: string }
  | { kind: 'group'; group: string; section?: string }
  | { kind: 'forum' }

const feeds = withHintLabels(flickr.feeds)

export const parseFlickrUrl = (url: string): FlickrUrl | undefined => {
  const page = flickr.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'forum') {
    return { kind: 'forum' }
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.params.tags }
  }

  if (page.key === 'group') {
    return { kind: 'group', group: page.params.id }
  }

  if (page.key === 'group-pool') {
    return { kind: 'group', group: page.params.id, section: 'pool' }
  }

  if (page.key === 'group-discuss') {
    return { kind: 'group', group: page.params.id, section: 'discuss' }
  }

  if (page.key === 'album') {
    return { kind: 'album', userId: page.params.userId, set: page.params.set }
  }

  if (page.key === 'userTag') {
    return { kind: 'userTag', userId: page.params.userId, tag: page.params.tags }
  }

  if (page.key === 'photostream') {
    return { kind: 'photostream', userId: page.params.userId }
  }

  if (page.key === 'favorites') {
    return { kind: 'favorites', userId: page.params.userId }
  }

  if (page.key === 'albums') {
    return { kind: 'albums', userId: page.params.userId }
  }

  if (page.key === 'galleries') {
    return { kind: 'galleries', userId: page.params.userId }
  }

  return { kind: 'subpage', userId: page.params.userId }
}

export const flickrHandler: PlatformHandler = {
  match: (url) => {
    const parsed = parseFlickrUrl(url)

    if (!parsed) {
      return false
    }

    if ('userId' in parsed) {
      return isFlickrNsid(parsed.userId)
    }

    return true
  },

  resolve: (url) => {
    const parsed = parseFlickrUrl(url)

    if (!parsed) {
      return []
    }

    // The forum and the uploads from everyone, with or without a location, need no value from the
    // page, so every page builds them after its own feeds. Each feed comes in Atom and then in RSS.
    if (parsed.kind === 'forum') {
      return [
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    // Tag page: /photos/tags/{tag}
    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tags: parsed.tag }, 'atom'),
        feeds.getFeedEntry('tag', { tags: parsed.tag }, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    // Group pool or discussion: /groups/{nsid}, /groups/{nsid}/pool, /groups/{nsid}/discuss
    if (parsed.kind === 'group') {
      const params = { id: parsed.group }

      if (parsed.section === 'discuss') {
        return [
          feeds.getFeedEntry('group-discuss', params, 'atom'),
          feeds.getFeedEntry('group-discuss', params, 'rss'),
          feeds.getFeedEntry('forum', {}, 'atom'),
          feeds.getFeedEntry('forum', {}, 'rss'),
          feeds.getFeedEntry('recent', {}, 'atom'),
          feeds.getFeedEntry('recent', {}, 'rss'),
          feeds.getFeedEntry('recent-geo', {}, 'atom'),
          feeds.getFeedEntry('recent-geo', {}, 'rss'),
        ]
      }

      if (parsed.section === 'pool') {
        return [
          feeds.getFeedEntry('group-pool', params, 'atom'),
          feeds.getFeedEntry('group-pool', params, 'rss'),
          feeds.getFeedEntry('group-photos', params, 'atom'),
          feeds.getFeedEntry('group-photos', params, 'rss'),
          feeds.getFeedEntry('group-geo', params, 'atom'),
          feeds.getFeedEntry('group-geo', params, 'rss'),
          feeds.getFeedEntry('forum', {}, 'atom'),
          feeds.getFeedEntry('forum', {}, 'rss'),
          feeds.getFeedEntry('recent', {}, 'atom'),
          feeds.getFeedEntry('recent', {}, 'rss'),
          feeds.getFeedEntry('recent-geo', {}, 'atom'),
          feeds.getFeedEntry('recent-geo', {}, 'rss'),
        ]
      }

      return [
        feeds.getFeedEntry('group-pool', params, 'atom'),
        feeds.getFeedEntry('group-pool', params, 'rss'),
        feeds.getFeedEntry('group-photos', params, 'atom'),
        feeds.getFeedEntry('group-photos', params, 'rss'),
        feeds.getFeedEntry('group-discuss', params, 'atom'),
        feeds.getFeedEntry('group-discuss', params, 'rss'),
        feeds.getFeedEntry('group-geo', params, 'atom'),
        feeds.getFeedEntry('group-geo', params, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    // The feeds take only the NSID and answer 404 for a path alias.
    if (!isFlickrNsid(parsed.userId)) {
      return []
    }

    const params = { id: parsed.userId }

    if (parsed.kind === 'album') {
      return [
        feeds.getFeedEntry('photoset', { ...params, set: parsed.set }, 'atom'),
        feeds.getFeedEntry('photoset', { ...params, set: parsed.set }, 'rss'),
        feeds.getFeedEntry('photos', params, 'atom'),
        feeds.getFeedEntry('photos', params, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    if (parsed.kind === 'userTag') {
      return [
        feeds.getFeedEntry('photos-tag', { ...params, tags: parsed.tag }, 'atom'),
        feeds.getFeedEntry('photos-tag', { ...params, tags: parsed.tag }, 'rss'),
        feeds.getFeedEntry('photos', params, 'atom'),
        feeds.getFeedEntry('photos', params, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    if (parsed.kind === 'favorites') {
      return [
        feeds.getFeedEntry('faves', params, 'atom'),
        feeds.getFeedEntry('faves', params, 'rss'),
        feeds.getFeedEntry('forum', {}, 'atom'),
        feeds.getFeedEntry('forum', {}, 'rss'),
        feeds.getFeedEntry('recent', {}, 'atom'),
        feeds.getFeedEntry('recent', {}, 'rss'),
        feeds.getFeedEntry('recent-geo', {}, 'atom'),
        feeds.getFeedEntry('recent-geo', {}, 'rss'),
      ]
    }

    return [
      feeds.getFeedEntry('photos', params, 'atom'),
      feeds.getFeedEntry('photos', params, 'rss'),
      feeds.getFeedEntry('forum', {}, 'atom'),
      feeds.getFeedEntry('forum', {}, 'rss'),
      feeds.getFeedEntry('recent', {}, 'atom'),
      feeds.getFeedEntry('recent', {}, 'rss'),
      feeds.getFeedEntry('recent-geo', {}, 'atom'),
      feeds.getFeedEntry('recent-geo', {}, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
