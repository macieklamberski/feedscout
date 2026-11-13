import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { FlickrUrl } from './flickr.js'
import { flickrHandler, parseFlickrUrl } from './flickr.js'

const feedsBase = 'https://www.flickr.com/services/feeds'

describe('parseFlickrUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: FlickrUrl = { kind: 'tag', tag: 'cats' }

    expect(parseFlickrUrl('https://flickr.com/photos/tags/cats')).toEqual(expected)
  })

  it('should return the tag for a tag page with a capitalized photos segment', () => {
    const expected: FlickrUrl = { kind: 'tag', tag: 'cats' }

    expect(parseFlickrUrl('https://flickr.com/Photos/tags/cats')).toEqual(expected)
  })

  it('should return the photostream for an NSID photostream page', () => {
    const expected: FlickrUrl = { kind: 'photostream', userId: '24662369@N07' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/24662369@N07')).toEqual(expected)
  })

  it('should return the photostream for a path alias', () => {
    const expected: FlickrUrl = { kind: 'photostream', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/alice')).toEqual(expected)
  })

  it('should return the photostream for a path alias with a capitalized photos segment', () => {
    const expected: FlickrUrl = { kind: 'photostream', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/Photos/alice')).toEqual(expected)
  })

  it('should return the photostream for the bare host', () => {
    const expected: FlickrUrl = { kind: 'photostream', userId: 'alice' }

    expect(parseFlickrUrl('https://flickr.com/photos/alice')).toEqual(expected)
  })

  it('should return the favorites for a favorites page', () => {
    const value = 'https://www.flickr.com/photos/24662369@N07/favorites'
    const expected: FlickrUrl = { kind: 'favorites', userId: '24662369@N07' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return the favorites for a favorites page with a capitalized favorites segment', () => {
    const value = 'https://www.flickr.com/photos/24662369@N07/Favorites'
    const expected: FlickrUrl = { kind: 'favorites', userId: '24662369@N07' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return the favorites for a later favorites page', () => {
    const value = 'https://www.flickr.com/photos/24662369@N07/favorites/page2'
    const expected: FlickrUrl = { kind: 'favorites', userId: '24662369@N07' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return the albums for an albums page', () => {
    const expected: FlickrUrl = { kind: 'albums', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/alice/albums')).toEqual(expected)
  })

  it('should return the albums for an albums page with a capitalized albums segment', () => {
    const expected: FlickrUrl = { kind: 'albums', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/alice/Albums')).toEqual(expected)
  })

  it('should return the galleries for a galleries page', () => {
    const expected: FlickrUrl = { kind: 'galleries', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/alice/galleries')).toEqual(expected)
  })

  it('should return the galleries for a galleries page with a capitalized galleries segment', () => {
    const expected: FlickrUrl = { kind: 'galleries', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/alice/Galleries')).toEqual(expected)
  })

  it('should return a subpage for a photo page', () => {
    const value = 'https://www.flickr.com/photos/alice/53012345678'
    const expected: FlickrUrl = { kind: 'subpage', userId: 'alice' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return a subpage for an album page', () => {
    const value = 'https://www.flickr.com/photos/alice/albums/72177720335744738'
    const expected: FlickrUrl = { kind: 'subpage', userId: 'alice' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return the group for an NSID group page', () => {
    const expected: FlickrUrl = { kind: 'group', group: '42097308@N00' }

    expect(parseFlickrUrl('https://www.flickr.com/groups/42097308@N00/')).toEqual(expected)
  })

  it('should return the group for an NSID group page with a capitalized groups segment', () => {
    const expected: FlickrUrl = { kind: 'group', group: '42097308@N00' }

    expect(parseFlickrUrl('https://www.flickr.com/Groups/42097308@N00/')).toEqual(expected)
  })

  it('should return undefined for a group NSID with a lowercase marker', () => {
    expect(parseFlickrUrl('https://www.flickr.com/groups/42097308@n00/pool')).toBeUndefined()
  })

  it('should return the canonical section for a capitalized group section', () => {
    const value = 'https://www.flickr.com/groups/42097308@N00/Discuss'
    const expected: FlickrUrl = { kind: 'group', group: '42097308@N00', section: 'discuss' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return the section for a group discussion page', () => {
    const value = 'https://www.flickr.com/groups/42097308@N00/discuss'
    const expected: FlickrUrl = { kind: 'group', group: '42097308@N00', section: 'discuss' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return undefined for the tags landing page', () => {
    expect(parseFlickrUrl('https://www.flickr.com/photos/tags/')).toBeUndefined()
  })

  it('should return undefined for the tags landing page with a capitalized tags segment', () => {
    expect(parseFlickrUrl('https://www.flickr.com/photos/Tags/')).toBeUndefined()
  })

  it('should return undefined for a group path alias', () => {
    expect(parseFlickrUrl('https://www.flickr.com/groups/mygroup')).toBeUndefined()
  })

  it('should return undefined for other site-wide pages', () => {
    expect(parseFlickrUrl('https://www.flickr.com')).toBeUndefined()
    expect(parseFlickrUrl('https://www.flickr.com/explore')).toBeUndefined()
  })

  it('should return the help forum', () => {
    const expected: FlickrUrl = { kind: 'forum' }

    expect(parseFlickrUrl('https://www.flickr.com/Help/forum/en-us/')).toEqual(expected)
  })

  it('should return undefined for a host that only ends in the Flickr host', () => {
    expect(parseFlickrUrl('https://flickr.com.example.com')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseFlickrUrl('https://example.com/photos/alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseFlickrUrl('not-a-url')).toBeUndefined()
  })
})

describe('flickrHandler', () => {
  describe('match', () => {
    it('should match a tag page', () => {
      expect(flickrHandler.match('https://flickr.com/photos/tags/cats')).toBe(true)
    })

    it('should match a group page', () => {
      expect(flickrHandler.match('https://www.flickr.com/groups/42097308@N00/')).toBe(true)
    })

    it('should match a help forum page', () => {
      expect(flickrHandler.match('https://www.flickr.com/help/forum/en-us/')).toBe(true)
    })

    it('should match a help forum page with a capitalized help segment', () => {
      expect(flickrHandler.match('https://www.flickr.com/Help/forum/en-us/')).toBe(true)
    })

    it('should not match the help forums link to another site', () => {
      expect(flickrHandler.match('https://www.flickr.com/help/forums')).toBe(false)
    })

    it('should not match the explore page', () => {
      expect(flickrHandler.match('https://www.flickr.com/explore')).toBe(false)
    })

    it('should match a photostream named by NSID', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/12345678@N00')).toBe(true)
    })

    it('should not match a photostream named by path alias', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/nasacommons')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should keep the scheme of an http page', () => {
      const value = 'http://flickr.com/photos/tags/rock'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.flickr.com/services/feeds/photos_public.gne?tags=rock',
          hint: { key: 'flickr:tag', label: 'Tag' },
        },
        {
          uri: 'http://www.flickr.com/services/feeds/photos_public.gne?tags=rock&format=rss_200',
          hint: { key: 'flickr:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: 'http://www.flickr.com/services/feeds/forums.gne',
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: 'http://www.flickr.com/services/feeds/forums.gne?format=rss_200',
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: 'http://www.flickr.com/services/feeds/photos_public.gne',
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: 'http://www.flickr.com/services/feeds/photos_public.gne?format=rss_200',
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: 'http://www.flickr.com/services/feeds/geo',
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: 'http://www.flickr.com/services/feeds/geo?format=rss_200',
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a tag with & inside the tags query value', () => {
      const value = 'https://www.flickr.com/photos/tags/rock&roll'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.flickr.com/services/feeds/photos_public.gne?tags=rock%26roll',
          hint: { key: 'flickr:tag', label: 'Tag' },
        },
        {
          uri: 'https://www.flickr.com/services/feeds/photos_public.gne?tags=rock%26roll&format=rss_200',
          hint: { key: 'flickr:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should keep an escaped tag escaped once in the tags query value', () => {
      const value = 'https://www.flickr.com/photos/tags/c%2B%2B'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.flickr.com/services/feeds/photos_public.gne?tags=c%2B%2B',
          hint: { key: 'flickr:tag', label: 'Tag' },
        },
        {
          uri: 'https://www.flickr.com/services/feeds/photos_public.gne?tags=c%2B%2B&format=rss_200',
          hint: { key: 'flickr:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag feed for a tag page', () => {
      const value = 'https://www.flickr.com/photos/tags/cats'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${feedsBase}/photos_public.gne?tags=cats`,
          hint: { key: 'flickr:tag', label: 'Tag' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?tags=cats&format=rss_200`,
          hint: { key: 'flickr:tag', label: 'Tag', format: 'rss' },
        },
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return photostream feed for an NSID photostream page', () => {
      const value = 'https://www.flickr.com/photos/24662369@N07/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${feedsBase}/photos_public.gne?id=24662369@N07`,
          hint: { key: 'flickr:photos', label: 'Photostream' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?id=24662369@N07&format=rss_200`,
          hint: { key: 'flickr:photos', label: 'Photostream', format: 'rss' },
        },
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return favorites feed for an NSID favorites page', () => {
      const value = 'https://www.flickr.com/photos/24662369@N07/favorites'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${feedsBase}/photos_faves.gne?id=24662369@N07`,
          hint: { key: 'flickr:faves', label: 'Favorites' },
        },
        {
          uri: `${feedsBase}/photos_faves.gne?id=24662369@N07&format=rss_200`,
          hint: { key: 'flickr:faves', label: 'Favorites', format: 'rss' },
        },
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a photostream named by path alias', () => {
      expect(flickrHandler.resolve('https://www.flickr.com/photos/nasacommons')).toEqual([])
    })

    it('should return empty array for a URL outside Flickr', () => {
      expect(flickrHandler.resolve('https://example.com/photos/12345678@N00')).toEqual([])
    })

    it('should return pool, discussion and location feeds for a group page', () => {
      const value = 'https://www.flickr.com/groups/42097308@N00/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${feedsBase}/groups_pool.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-pool', label: 'Group pool' },
        },
        {
          uri: `${feedsBase}/groups_pool.gne?id=42097308@N00&format=rss_200`,
          hint: { key: 'flickr:group-pool', label: 'Group pool', format: 'rss' },
        },
        {
          uri: `${feedsBase}/groups_discuss.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-discuss', label: 'Group discussions' },
        },
        {
          uri: `${feedsBase}/groups_discuss.gne?id=42097308@N00&format=rss_200`,
          hint: { key: 'flickr:group-discuss', label: 'Group discussions', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo/?g=42097308@N00`,
          hint: { key: 'flickr:group-geo', label: 'Group pool with location' },
        },
        {
          uri: `${feedsBase}/geo/?g=42097308@N00&format=rss_200`,
          hint: { key: 'flickr:group-geo', label: 'Group pool with location', format: 'rss' },
        },
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the pool and location feeds for a group pool page', () => {
      const value = 'https://www.flickr.com/groups/42097308@N00/pool/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${feedsBase}/groups_pool.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-pool', label: 'Group pool' },
        },
        {
          uri: `${feedsBase}/groups_pool.gne?id=42097308@N00&format=rss_200`,
          hint: { key: 'flickr:group-pool', label: 'Group pool', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo/?g=42097308@N00`,
          hint: { key: 'flickr:group-geo', label: 'Group pool with location' },
        },
        {
          uri: `${feedsBase}/geo/?g=42097308@N00&format=rss_200`,
          hint: { key: 'flickr:group-geo', label: 'Group pool with location', format: 'rss' },
        },
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the discussion and site-wide feeds for a group discuss page', () => {
      const value = 'https://www.flickr.com/groups/42097308@N00/discuss/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${feedsBase}/groups_discuss.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-discuss', label: 'Group discussions' },
        },
        {
          uri: `${feedsBase}/groups_discuss.gne?id=42097308@N00&format=rss_200`,
          hint: { key: 'flickr:group-discuss', label: 'Group discussions', format: 'rss' },
        },
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum feed for a help forum page', () => {
      const value = 'https://www.flickr.com/help/forum/en-us/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
        {
          uri: `${feedsBase}/forums.gne?format=rss_200`,
          hint: { key: 'flickr:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: `${feedsBase}/photos_public.gne`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone' },
        },
        {
          uri: `${feedsBase}/photos_public.gne?format=rss_200`,
          hint: { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
        },
        {
          uri: `${feedsBase}/geo`,
          hint: { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
        },
        {
          uri: `${feedsBase}/geo?format=rss_200`,
          hint: {
            key: 'flickr:recent-geo',
            label: 'Uploads from everyone with location',
            format: 'rss',
          },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the photostream hint for a photostream feed', () => {
      const value = 'https://www.flickr.com/services/feeds/photos_public.gne?id=24662369@N07'
      const expected: DiscoverUriHint = { key: 'flickr:photos', label: 'Photostream' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the photostream hint for a photostream feed on the API host', () => {
      const value =
        'https://api.flickr.com/services/feeds/photos_public.gne?format=atom&id=24662369%40N07&lang=en-us'
      const expected: DiscoverUriHint = { key: 'flickr:photos', label: 'Photostream' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the photostream hint for a photostream feed on the bare host', () => {
      const value =
        'https://flickr.com/services/feeds/photos_public.gne?id=24662369@N07&format=rss_200'
      const expected: DiscoverUriHint = {
        key: 'flickr:photos',
        label: 'Photostream',
        format: 'rss',
      }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the photostream hint for a photostream feed over http', () => {
      const value = 'http://api.flickr.com/services/feeds/photos_public.gne?id=24662369@N07'
      const expected: DiscoverUriHint = { key: 'flickr:photos', label: 'Photostream' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://www.flickr.com/services/feeds/photos_public.gne?tags=cats'
      const expected: DiscoverUriHint = { key: 'flickr:tag', label: 'Tag' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed on the API host', () => {
      const value =
        'https://api.flickr.com/services/feeds/photos_public.gne?format=rss_200&lang=en-us&tags=cats'
      const expected: DiscoverUriHint = { key: 'flickr:tag', label: 'Tag', format: 'rss' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the favorites hint for a favorites feed', () => {
      const value = 'https://www.flickr.com/services/feeds/photos_faves.gne?id=24662369@N07'
      const expected: DiscoverUriHint = { key: 'flickr:faves', label: 'Favorites' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the favorites hint for a favorites feed naming the user by nsid', () => {
      const value =
        'https://api.flickr.com/services/feeds/photos_faves.gne?format=rss_200&lang=en-us&nsid=24662369%40N07'
      const expected: DiscoverUriHint = { key: 'flickr:faves', label: 'Favorites', format: 'rss' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group pool hint for a group pool feed', () => {
      const value =
        'https://api.flickr.com/services/feeds/groups_pool.gne?format=atom&id=42097308@N00&lang=en-us'
      const expected: DiscoverUriHint = { key: 'flickr:group-pool', label: 'Group pool' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group discussion hint for a group discussion feed', () => {
      const value =
        'https://api.flickr.com/services/feeds/groups_discuss.gne?format=rss_200&id=42097308%40N00&lang=en-us'
      const expected: DiscoverUriHint = {
        key: 'flickr:group-discuss',
        label: 'Group discussions',
        format: 'rss',
      }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group location hint for a group location feed', () => {
      const value = 'https://www.flickr.com/services/feeds/geo/?g=42097308@N00&lang=en-us'
      const expected: DiscoverUriHint = {
        key: 'flickr:group-geo',
        label: 'Group pool with location',
      }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the forum hint for the forum feed', () => {
      const value = 'https://www.flickr.com/services/feeds/forums.gne'
      const expected: DiscoverUriHint = { key: 'flickr:forum', label: 'Forum' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should read the feed route words in any case', () => {
      const value = 'https://www.flickr.com/Services/Feeds/Photos_Public.gne?id=24662369@N07'
      const expected: DiscoverUriHint = { key: 'flickr:photos', label: 'Photostream' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group pool hint for a group pool feed with a tag it ignores', () => {
      const value =
        'https://www.flickr.com/services/feeds/groups_pool.gne?id=42097308@N00&tags=cats'
      const expected: DiscoverUriHint = { key: 'flickr:group-pool', label: 'Group pool' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the favorites hint for a favorites feed with a tag it ignores', () => {
      const value =
        'https://www.flickr.com/services/feeds/photos_faves.gne?id=24662369@N07&tags=cats'
      const expected: DiscoverUriHint = { key: 'flickr:faves', label: 'Favorites' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed with an empty id', () => {
      const value = 'https://www.flickr.com/services/feeds/photos_public.gne?id=&tags=cats'
      const expected: DiscoverUriHint = { key: 'flickr:tag', label: 'Tag' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tagged photostream hint for a photostream feed narrowed to a tag', () => {
      const value =
        'https://api.flickr.com/services/feeds/photos_public.gne?id=24662369@N07&tags=cats&format=atom'
      const expected: DiscoverUriHint = { key: 'flickr:photos-tag', label: 'Tagged photostream' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tagged group location hint for a group location feed narrowed to a tag', () => {
      const value = 'https://www.flickr.com/services/feeds/geo/?g=42097308@N00&tags=cats'
      const expected: DiscoverUriHint = {
        key: 'flickr:group-tag-geo',
        label: 'Tagged group pool with location',
      }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tagged photostream location hint for a user location feed narrowed to a tag', () => {
      const value = 'https://www.flickr.com/services/feeds/geo?id=24662369@N07&tags=cats'
      const expected: DiscoverUriHint = {
        key: 'flickr:photos-tag-geo',
        label: 'Tagged photostream with location',
      }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag location hint for a tag location feed with an empty id', () => {
      const value = 'https://www.flickr.com/services/feeds/geo?id=&tags=cats'
      const expected: DiscoverUriHint = { key: 'flickr:tag-geo', label: 'Tag with location' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group discussion hint for a group discussion feed with a tag it ignores', () => {
      const value =
        'https://www.flickr.com/services/feeds/groups_discuss.gne?id=42097308@N00&tags=cats'
      const expected: DiscoverUriHint = { key: 'flickr:group-discuss', label: 'Group discussions' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a tag feed narrowed to a group pool', () => {
      const value =
        'https://www.flickr.com/services/feeds/photos_public.gne?tags=cats&g=42097308@N00'

      expect(flickrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return the uploads hint for the feed of every public photo', () => {
      const value = 'https://www.flickr.com/services/feeds/photos_public.gne'
      const expected: DiscoverUriHint = { key: 'flickr:recent', label: 'Uploads from everyone' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the uploads hint with the format for the RSS feed of every public photo', () => {
      const value = 'https://api.flickr.com/services/feeds/photos_public.gne?format=rss_200'
      const expected: DiscoverUriHint = {
        key: 'flickr:recent',
        label: 'Uploads from everyone',
        format: 'rss',
      }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the uploads with location hint for the feed of every located photo', () => {
      const value = 'https://www.flickr.com/services/feeds/geo/'
      const expected: DiscoverUriHint = {
        key: 'flickr:recent-geo',
        label: 'Uploads from everyone with location',
      }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the forum hint with the format for the RSS forum feed', () => {
      const value = 'https://www.flickr.com/services/feeds/forums.gne?format=rss_200'
      const expected: DiscoverUriHint = { key: 'flickr:forum', label: 'Forum', format: 'rss' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the album hint with the format for an RSS album feed', () => {
      const value =
        'https://api.flickr.com/services/feeds/photoset.gne?set=72157600000000000&nsid=12345@N00&format=rss_200'
      const expected: DiscoverUriHint = { key: 'flickr:photoset', label: 'Album', format: 'rss' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the hint without a format for a format value Flickr does not know', () => {
      const value =
        'https://api.flickr.com/services/feeds/photos_public.gne?id=12345@N00&format=feed-rss_200'
      const expected: DiscoverUriHint = { key: 'flickr:photos', label: 'Photostream' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the photostream location hint for a user location feed', () => {
      const value =
        'https://api.flickr.com/services/feeds/geo?format=rss_200&id=24662369%40N07&lang=en-us'
      const expected: DiscoverUriHint = {
        key: 'flickr:photos-geo',
        label: 'Photostream with location',
        format: 'rss',
      }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag location hint for a tag location feed', () => {
      const value = 'https://api.flickr.com/services/feeds/geo/?tags=cats'
      const expected: DiscoverUriHint = { key: 'flickr:tag-geo', label: 'Tag with location' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the album hint for an album feed', () => {
      const value =
        'https://api.flickr.com/services/feeds/photoset.gne?set=72157594208548823&nsid=24662369@N07&lang=en-us'
      const expected: DiscoverUriHint = { key: 'flickr:photoset', label: 'Album' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the contacts hint for a friends feed', () => {
      const value =
        'https://api.flickr.com/services/feeds/photos_friends.gne?user_id=24662369@N07&friends=0&display_all=1&format=rss_200'
      const expected: DiscoverUriHint = { key: 'flickr:contacts', label: 'Contacts', format: 'rss' }

      expect(flickrHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a photostream page', () => {
      const value = 'https://www.flickr.com/photos/24662369@N07/'

      expect(flickrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a photostream feed path on another host', () => {
      const value = 'https://example.com/services/feeds/photos_public.gne?id=24662369@N07'

      expect(flickrHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for an invalid URL', () => {
      const value = 'not a url'

      expect(flickrHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://api.flickr.com/services/feeds/photos_public.gne?format=atom&id=24662369%40N07&lang=en-us',
        { key: 'flickr:photos', label: 'Photostream' },
      ],
      [
        'https://api.flickr.com/services/feeds/photos_public.gne?tags=cats',
        { key: 'flickr:tag', label: 'Tag' },
      ],
      [
        'https://api.flickr.com/services/feeds/photos_faves.gne?format=rss_200&lang=en-us&nsid=24662369%40N07',
        { key: 'flickr:faves', label: 'Favorites', format: 'rss' },
      ],
      [
        'https://api.flickr.com/services/feeds/groups_pool.gne?format=atom&id=42097308@N00&lang=en-us',
        { key: 'flickr:group-pool', label: 'Group pool' },
      ],
      [
        'https://api.flickr.com/services/feeds/groups_discuss.gne?format=rss_200&id=42097308%40N00&lang=en-us',
        { key: 'flickr:group-discuss', label: 'Group discussions', format: 'rss' },
      ],
      [
        'https://www.flickr.com/services/feeds/geo/?g=42097308@N00',
        { key: 'flickr:group-geo', label: 'Group pool with location' },
      ],
      ['https://www.flickr.com/services/feeds/forums.gne', { key: 'flickr:forum', label: 'Forum' }],
      [
        'http://api.flickr.com/services/feeds/photos_public.gne?format=rss_200',
        { key: 'flickr:recent', label: 'Uploads from everyone', format: 'rss' },
      ],
      [
        'https://www.flickr.com/services/feeds/geo',
        { key: 'flickr:recent-geo', label: 'Uploads from everyone with location' },
      ],
      [
        'https://www.flickr.com/services/feeds/groups_pool.gne?id=42097308@N00&format=rss_200',
        { key: 'flickr:group-pool', label: 'Group pool', format: 'rss' },
      ],
      [
        'https://www.flickr.com/services/feeds/photos_public.gne?id=&tags=cats',
        { key: 'flickr:tag', label: 'Tag' },
      ],
      [
        'https://www.flickr.com/services/feeds/groups_pool.gne?id=42097308@N00&tags=cats',
        { key: 'flickr:group-pool', label: 'Group pool' },
      ],
      [
        'https://www.flickr.com/services/feeds/photos_faves.gne?id=24662369@N07&tags=cats',
        { key: 'flickr:faves', label: 'Favorites' },
      ],
      [
        'http://api.flickr.com/services/feeds/photos_public.gne?format=rss_200&id=12345%40N00&tags=cats',
        { key: 'flickr:photos-tag', label: 'Tagged photostream', format: 'rss' },
      ],
      [
        'https://api.flickr.com/services/feeds/photoset.gne?lang=en-us&nsid=12345%40N00&set=72157600000000000',
        { key: 'flickr:photoset', label: 'Album' },
      ],
      [
        'https://www.flickr.com/services/feeds/photos_friends.gne?display_all=1&format=rss_200&friends=0&user_id=12345%40N00',
        { key: 'flickr:contacts', label: 'Contacts', format: 'rss' },
      ],
      [
        'https://api.flickr.com/services/feeds/geo?format=rss_200&id=12345%40N00&lang=en-us',
        { key: 'flickr:photos-geo', label: 'Photostream with location', format: 'rss' },
      ],
      [
        'https://api.flickr.com/services/feeds/geo?tags=cats',
        { key: 'flickr:tag-geo', label: 'Tag with location' },
      ],
      [
        'https://api.flickr.com/services/feeds/geo?format=rss_200&id=12345%40N00&tags=cats',
        { key: 'flickr:photos-tag-geo', label: 'Tagged photostream with location', format: 'rss' },
      ],
      [
        'https://www.flickr.com/services/feeds/geo/?g=42097308@N00&tags=cats',
        { key: 'flickr:group-tag-geo', label: 'Tagged group pool with location' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [flickrHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
