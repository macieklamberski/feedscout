import { describe, expect, it } from 'bun:test'
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
    it('should match a photostream page', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/alice')).toBe(true)
    })

    it('should match a favorites page', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/alice/favorites')).toBe(true)
    })

    it('should match an albums page', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/alice/albums')).toBe(true)
    })

    it('should match a galleries page', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/alice/galleries')).toBe(true)
    })

    it('should not match tag pages', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/tags/sunset')).toBe(false)
    })

    it('should not match photo pages', () => {
      expect(flickrHandler.match('https://www.flickr.com/photos/alice/53012345678')).toBe(false)
    })

    it('should not match album pages', () => {
      const value = 'https://www.flickr.com/photos/alice/albums/72177720335744738'

      expect(flickrHandler.match(value)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the owner buddyicon from a photostream page', () => {
      const expected = [
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
      const expected = [
        { uri: 'https://live.staticflickr.com/2852/buddyicons/12345678@N00_r.jpg?1369154786' },
      ]

      expect(flickrHandler.resolve('https://www.flickr.com/photos/alice', content)).toEqual(
        expected,
      )
    })

    it('should return the owner buddyicon from an albums page', () => {
      const value = 'https://www.flickr.com/photos/alice/albums'
      const expected = [
        { uri: 'https://live.staticflickr.com/2852/buddyicons/12345678@N00_r.jpg?1369154786' },
      ]

      expect(flickrHandler.resolve(value, profileContent)).toEqual(expected)
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
