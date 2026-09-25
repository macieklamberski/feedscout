import { describe, expect, it } from 'bun:test'
import type { FlickrUrl } from './flickr.js'
import { flickrHandler, parseFlickrUrl } from './flickr.js'

const feedsBase = 'https://www.flickr.com/services/feeds'

describe('parseFlickrUrl', () => {
  it('should return the tag for a tag page', () => {
    const expected: FlickrUrl = { kind: 'tag', tag: 'cats' }

    expect(parseFlickrUrl('https://flickr.com/photos/tags/cats')).toEqual(expected)
  })

  it('should return the photostream for an NSID photostream page', () => {
    const expected: FlickrUrl = { kind: 'photostream', userId: '24662369@N07' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/24662369@N07')).toEqual(expected)
  })

  it('should return the photostream for a path alias', () => {
    const expected: FlickrUrl = { kind: 'photostream', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/alice')).toEqual(expected)
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

  it('should return the favorites for a later favorites page', () => {
    const value = 'https://www.flickr.com/photos/24662369@N07/favorites/page2'
    const expected: FlickrUrl = { kind: 'favorites', userId: '24662369@N07' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return the albums for an albums page', () => {
    const expected: FlickrUrl = { kind: 'albums', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/alice/albums')).toEqual(expected)
  })

  it('should return the galleries for a galleries page', () => {
    const expected: FlickrUrl = { kind: 'galleries', userId: 'alice' }

    expect(parseFlickrUrl('https://www.flickr.com/photos/alice/galleries')).toEqual(expected)
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

  it('should return the section for a group discussion page', () => {
    const value = 'https://www.flickr.com/groups/42097308@N00/discuss'
    const expected: FlickrUrl = { kind: 'group', group: '42097308@N00', section: 'discuss' }

    expect(parseFlickrUrl(value)).toEqual(expected)
  })

  it('should return undefined for the tags landing page', () => {
    expect(parseFlickrUrl('https://www.flickr.com/photos/tags/')).toBeUndefined()
  })

  it('should return undefined for a group path alias', () => {
    expect(parseFlickrUrl('https://www.flickr.com/groups/mygroup')).toBeUndefined()
  })

  it('should return undefined for site-wide pages', () => {
    expect(parseFlickrUrl('https://www.flickr.com')).toBeUndefined()
    expect(parseFlickrUrl('https://www.flickr.com/explore')).toBeUndefined()
    expect(parseFlickrUrl('https://www.flickr.com/help/forum')).toBeUndefined()
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
    it('should return tag feed for a tag page', () => {
      const value = 'https://www.flickr.com/photos/tags/cats'
      const expected = [
        {
          uri: `${feedsBase}/photos_public.gne?tags=cats`,
          hint: { key: 'flickr:tag', label: 'Tag' },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return photostream feed for an NSID photostream page', () => {
      const value = 'https://www.flickr.com/photos/24662369@N07/'
      const expected = [
        {
          uri: `${feedsBase}/photos_public.gne?id=24662369@N07`,
          hint: { key: 'flickr:photos', label: 'Photostream' },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return favorites feed for an NSID favorites page', () => {
      const value = 'https://www.flickr.com/photos/24662369@N07/favorites'
      const expected = [
        {
          uri: `${feedsBase}/photos_faves.gne?id=24662369@N07`,
          hint: { key: 'flickr:faves', label: 'Favorites' },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a photostream named by path alias', () => {
      expect(flickrHandler.resolve('https://www.flickr.com/photos/nasacommons')).toEqual([])
    })

    it('should return pool, discussion and location feeds for a group page', () => {
      const value = 'https://www.flickr.com/groups/42097308@N00/'
      const expected = [
        {
          uri: `${feedsBase}/groups_pool.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-pool', label: 'Group pool' },
        },
        {
          uri: `${feedsBase}/groups_discuss.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-discuss', label: 'Group discussions' },
        },
        {
          uri: `${feedsBase}/geo/?g=42097308@N00`,
          hint: { key: 'flickr:group-geo', label: 'Group pool with location' },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the pool and location feeds for a group pool page', () => {
      const value = 'https://www.flickr.com/groups/42097308@N00/pool/'
      const expected = [
        {
          uri: `${feedsBase}/groups_pool.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-pool', label: 'Group pool' },
        },
        {
          uri: `${feedsBase}/geo/?g=42097308@N00`,
          hint: { key: 'flickr:group-geo', label: 'Group pool with location' },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the discussion feed for a group discuss page', () => {
      const value = 'https://www.flickr.com/groups/42097308@N00/discuss/'
      const expected = [
        {
          uri: `${feedsBase}/groups_discuss.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-discuss', label: 'Group discussions' },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the forum feed for a help forum page', () => {
      const value = 'https://www.flickr.com/help/forum/en-us/'
      const expected = [
        {
          uri: `${feedsBase}/forums.gne`,
          hint: { key: 'flickr:forum', label: 'Forum' },
        },
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })
  })
})
