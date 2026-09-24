import { describe, expect, it } from 'bun:test'
import { writeasHandler } from './writeas.js'

describe('writeasHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://write.as/matt'],
      [true, 'https://www.write.as/user'],
      [true, 'https://write.as'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(writeasHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(writeasHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://write.as/matt'
      const expected = [
        {
          uri: 'https://write.as/matt/feed/',
          hint: { key: 'writeas:blog', label: 'Blog' },
        },
      ]

      expect(writeasHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL regardless of subpath', () => {
      const value = 'https://write.as/matt/some-post-slug'
      const expected = [
        {
          uri: 'https://write.as/matt/feed/',
          hint: { key: 'writeas:blog', label: 'Blog' },
        },
      ]

      expect(writeasHandler.resolve(value)).toEqual(expected)
    })

    it('should return tag and blog feeds for tag page', () => {
      const value = 'https://write.as/matt/tag:reading'
      const expected = [
        {
          uri: 'https://write.as/matt/tag:reading/feed/',
          hint: { key: 'writeas:tag', label: 'Tag' },
        },
        {
          uri: 'https://write.as/matt/feed/',
          hint: { key: 'writeas:blog', label: 'Blog' },
        },
      ]

      expect(writeasHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for root path', () => {
      const value = 'https://write.as/'

      expect(writeasHandler.resolve(value)).toEqual([])
    })

    it('should return empty array for excluded paths', () => {
      const value = 'https://write.as/login'

      expect(writeasHandler.resolve(value)).toEqual([])
    })

    it.todo('should define behavior for invalid URL input', () => {
      // resolve('not-a-url') currently throws a TypeError from the unguarded new URL call; the
      // desired contract (throw vs empty array) is undecided.
    })
  })
})
