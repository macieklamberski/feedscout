import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../../common/types.js'
import { noteHandler } from './note.js'

const avatarUrl =
  'https://assets.st-note.com/production/uploads/images/1234/profile_abc.png?fit=bounds&format=jpeg&quality=85&width=330'
const profileContent = `<script>self.__next_f.push([1,"{\\"urlname\\":\\"alice\\",\\"profileImageUrl\\":\\"https://assets.st-note.com/production/uploads/images/1234/profile_abc.png?fit=bounds\\u0026format=jpeg\\u0026quality=85\\u0026width=330\\"}"])</script>`

describe('noteHandler', () => {
  describe('match', () => {
    it('should match profile URLs', () => {
      expect(noteHandler.match('https://note.com/alice')).toBe(true)
    })

    it('should match profile URLs with trailing slash', () => {
      expect(noteHandler.match('https://note.com/alice/')).toBe(true)
    })

    it('should match www.note.com profile URLs', () => {
      expect(noteHandler.match('https://www.note.com/alice')).toBe(true)
    })

    it('should not match magazine URLs', () => {
      expect(noteHandler.match('https://note.com/alice/m/m1861fae39074')).toBe(false)
    })

    it('should not match hashtag pages', () => {
      expect(noteHandler.match('https://note.com/hashtag/design')).toBe(false)
      expect(noteHandler.match('https://note.com/tag/design')).toBe(false)
    })

    it('should not match article pages', () => {
      expect(noteHandler.match('https://note.com/alice/n/n1234567890ab')).toBe(false)
    })

    it('should not match excluded paths', () => {
      expect(noteHandler.match('https://note.com/search')).toBe(false)
    })

    it('should not match root URL', () => {
      expect(noteHandler.match('https://note.com/')).toBe(false)
    })

    it('should not match non-note URLs', () => {
      expect(noteHandler.match('https://example.com/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(noteHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    describe('happy paths', () => {
      it('should return avatar from profile page payload', () => {
        const expected: Array<DiscoverUriEntry> = [{ uri: avatarUrl }]

        expect(noteHandler.resolve('https://note.com/alice', profileContent)).toEqual(expected)
      })
    })

    describe('sad paths', () => {
      it('should return empty array when content is absent', () => {
        expect(noteHandler.resolve('https://note.com/alice')).toEqual([])
      })

      it('should return empty array when page has no payload', () => {
        expect(noteHandler.resolve('https://note.com/alice', '<html></html>')).toEqual([])
      })

      it('should return empty array when profileImageUrl is not valid JSON', () => {
        const content = '{\\"profileImageUrl\\":\\"https://example.com/\tprofile.png\\"}'

        expect(noteHandler.resolve('https://note.com/alice', content)).toEqual([])
      })

      it('should return empty array for magazine pages', () => {
        const url = 'https://note.com/alice/m/m1861fae39074'

        expect(noteHandler.resolve(url, profileContent)).toEqual([])
      })

      it('should return empty array for invalid URL', () => {
        expect(noteHandler.resolve('not-a-url', profileContent)).toEqual([])
      })
    })
  })
})
