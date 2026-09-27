import { describe, expect, it } from 'bun:test'
import { cratesIoHandler } from './cratesIo.js'

describe('cratesIoHandler', () => {
  describe('match', () => {
    it('should match a crate page', () => {
      expect(cratesIoHandler.match('https://crates.io/crates/example-crate')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(cratesIoHandler.match('https://example.com/crates/example-crate')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the releases feed for a crate page', () => {
      const value = 'https://crates.io/crates/example_crate'
      const expected = [
        {
          uri: 'https://static.crates.io/rss/crates/example_crate.xml',
          hint: { key: 'crates-io:releases', label: 'Releases' },
        },
      ]

      expect(cratesIoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the releases feed for a crate version page', () => {
      const value = 'https://crates.io/crates/example-crate/1.0.0'
      const expected = [
        {
          uri: 'https://static.crates.io/rss/crates/example-crate.xml',
          hint: { key: 'crates-io:releases', label: 'Releases' },
        },
      ]

      expect(cratesIoHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the case of the crate name', () => {
      const value = 'https://crates.io/Crates/Example'
      const expected = [
        {
          uri: 'https://static.crates.io/rss/crates/Example.xml',
          hint: { key: 'crates-io:releases', label: 'Releases' },
        },
      ]

      expect(cratesIoHandler.resolve(value)).toEqual(expected)
    })

    it('should return the site-wide feeds for the home page', () => {
      const value = 'https://crates.io/'
      const expected = [
        {
          uri: 'https://static.crates.io/rss/crates.xml',
          hint: { key: 'crates-io:new-crates', label: 'New crates' },
        },
        {
          uri: 'https://static.crates.io/rss/updates.xml',
          hint: { key: 'crates-io:updates', label: 'Recent updates' },
        },
      ]

      expect(cratesIoHandler.resolve(value)).toEqual(expected)
    })

    it('should return an empty array for the crate list', () => {
      expect(cratesIoHandler.resolve('https://crates.io/crates')).toEqual([])
    })
  })
})
