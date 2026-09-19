import { describe, expect, it } from 'bun:test'
import { flickrHandler } from './flickr.js'

const feedsBase = 'https://www.flickr.com/services/feeds'

describe('flickrHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://flickr.com/photos/tags/cats'],
      [true, 'https://www.flickr.com/photos/24662369@N07'],
      [true, 'https://www.flickr.com/photos/24662369@N07/favorites'],
      [true, 'https://www.flickr.com/groups/42097308@N00/discuss'],
      [true, 'https://www.flickr.com/help/forum'],
      [false, 'https://www.flickr.com'],
      [false, 'https://www.flickr.com/explore'],
      [false, 'https://www.flickr.com/photos/thomashawk'],
      [false, 'https://www.flickr.com/groups/mygroup'],
      [false, 'https://flickr.com.example.com'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(flickrHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(flickrHandler.match('not-a-url')).toBe(false)
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

    it('should return pool and discussion feeds for a group page', () => {
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
      ]

      expect(flickrHandler.resolve(value)).toEqual(expected)
    })

    it('should return only the pool feed for a group pool page', () => {
      const value = 'https://www.flickr.com/groups/42097308@N00/pool/'
      const expected = [
        {
          uri: `${feedsBase}/groups_pool.gne?id=42097308@N00`,
          hint: { key: 'flickr:group-pool', label: 'Group pool' },
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

    it('should return nothing for an alias photostream page', () => {
      expect(flickrHandler.resolve('https://www.flickr.com/photos/nasacommons')).toEqual([])
    })

    it('should return nothing for an alias group page', () => {
      expect(flickrHandler.resolve('https://www.flickr.com/groups/flickrcentral/pool/')).toEqual([])
    })

    it('should return nothing for the homepage', () => {
      expect(flickrHandler.resolve('https://www.flickr.com')).toEqual([])
    })
  })
})
