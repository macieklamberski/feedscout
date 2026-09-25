import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { flickrHandler } from './flickr.js'

const profileContent = `
  <div class="avatar-container">
    <div
      class="avatar no-menu person large no-edit"
      style="background-image: url(//live.staticflickr.com/2852/buddyicons/12345678@N00_r.jpg?1369154786#12345678@N00);"
    >
      <div class="loading-overlay"></div>
    </div>
  </div>
`

describe('flickrHandler', () => {
  describe('match', () => {
    it('should match photostream URLs with a path alias', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/alice')).toBe(true)
    })

    it('should match photostream URLs with an NSID', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/12345678@N00/')).toBe(true)
    })

    it('should match favorites URLs', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/alice/favorites')).toBe(true)
    })

    it('should match the bare flickr.com host', () => {
      expect(flickrHandler.match('https://flickr.com/photos/alice')).toBe(true)
    })

    it('should not match tag pages', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/tags/sunset')).toBe(false)
    })

    it('should not match the tags landing page', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/tags/')).toBe(false)
    })

    it('should not match photo pages', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/alice/53012345678')).toBe(false)
    })

    it('should not match group pages', () => {
      expect(flickrHandler.match('https://www.flickr.com/groups/11111111@N01')).toBe(false)
    })

    it('should not match non-Flickr URLs', () => {
      expect(flickrHandler.match('https://example.com/photos/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(flickrHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the owner buddyicon from a photostream page', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://live.staticflickr.com/2852/buddyicons/12345678@N00_r.jpg?1369154786' },
      ]

      expect(flickrHandler.resolve('https://www.flickr.com/photos/alice', profileContent)).toEqual(
        expected,
      )
    })

    it('should return the owner buddyicon when style comes before class', () => {
      const content = `
        <div class="avatar-container">
          <div
            style="background-image: url(//live.staticflickr.com/2852/buddyicons/12345678@N00_r.jpg?1369154786#12345678@N00);"
            class="avatar no-menu person large no-edit"
          ></div>
        </div>
      `
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://live.staticflickr.com/2852/buddyicons/12345678@N00_r.jpg?1369154786' },
      ]

      expect(flickrHandler.resolve('https://www.flickr.com/photos/alice', content)).toEqual(
        expected,
      )
    })

    it('should return the owner buddyicon from a favorites page', () => {
      const expected: Array<DiscoverUriEntry> = [
        { uri: 'https://live.staticflickr.com/2852/buddyicons/12345678@N00_r.jpg?1369154786' },
      ]

      expect(
        flickrHandler.resolve('https://www.flickr.com/photos/alice/favorites', profileContent),
      ).toEqual(expected)
    })

    it('should return empty array when the page has no owner avatar', () => {
      const content = `
        <div
          class="avatar group medium"
          style="background-image: url(//live.staticflickr.com/26/buddyicons/87654321@N00_r.jpg?1132154005);"
        ></div>
      `

      expect(flickrHandler.resolve('https://www.flickr.com/photos/alice', content)).toEqual([])
    })

    it('should return empty array without content', () => {
      expect(flickrHandler.resolve('https://www.flickr.com/photos/alice')).toEqual([])
    })
  })
})
