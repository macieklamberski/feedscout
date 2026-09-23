import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { velogHandler } from './velog.js'

const profileHtml = `
  <div class="UserProfile_left__NbH_X">
    <img
      alt="profile"
      fetchPriority="high"
      width="128"
      height="128"
      src="https://images.velog.io/images/alice/profile/0f3c/avatar.png"
    />
  </div>
`

const postHtml = `
  <img
    src="https://velog.velcdn.com/images/alice/profile/0f3c/avatar.png"
    alt="profile"
  />
`

const placeholderHtml = `
  <img
    alt="profile"
    src="https://velcdn.com/images/user-thumbnail.png"
  />
`

describe('velogHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(velogHandler.match('https://velog.io/@alice')).toBe(true)
    })

    it('should match profile subpages', () => {
      expect(velogHandler.match('https://velog.io/@alice/posts')).toBe(true)
      expect(velogHandler.match('https://velog.io/@alice/series')).toBe(true)
      expect(velogHandler.match('https://velog.io/@alice/about')).toBe(true)
    })

    it('should match post URLs', () => {
      expect(velogHandler.match('https://velog.io/@alice/hello-world')).toBe(true)
    })

    it('should match www.velog.io profile URLs', () => {
      expect(velogHandler.match('https://www.velog.io/@alice')).toBe(true)
    })

    it('should not match the home page', () => {
      expect(velogHandler.match('https://velog.io/')).toBe(false)
    })

    it('should not match non-profile paths', () => {
      expect(velogHandler.match('https://velog.io/recent')).toBe(false)
      expect(velogHandler.match('https://velog.io/tags/react')).toBe(false)
    })

    it('should not match non-velog URLs', () => {
      expect(velogHandler.match('https://example.com/@alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(velogHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return profile image from profile page HTML', () => {
        const result = velogHandler.resolve('https://velog.io/@alice', profileHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://images.velog.io/images/alice/profile/0f3c/avatar.png' },
        ]

        expect(result).toEqual(expected)
      })

      it('should return author image from post page HTML', () => {
        const result = velogHandler.resolve('https://velog.io/@alice/hello-world', postHtml)
        const expected: Array<DiscoverUriEntry> = [
          { uri: 'https://velog.velcdn.com/images/alice/profile/0f3c/avatar.png' },
        ]

        expect(result).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array for the home page', () => {
        const result = velogHandler.resolve('https://velog.io/', profileHtml)

        expect(result).toEqual([])
      })

      it('should return empty array when content is absent', () => {
        const result = velogHandler.resolve('https://velog.io/@alice')

        expect(result).toEqual([])
      })

      it('should return empty array when HTML has no profile image', () => {
        const result = velogHandler.resolve('https://velog.io/@alice', '<html><body></body></html>')

        expect(result).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        const result = velogHandler.resolve('not-a-url', profileHtml)

        expect(result).toEqual([])
      })
    })

    describe('edge cases', () => {
      it('should skip placeholder image in HTML', () => {
        const result = velogHandler.resolve('https://velog.io/@alice', placeholderHtml)

        expect(result).toEqual([])
      })
    })
  })
})
