import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type MeeNuUrl, meeNuHandler, parseMeeNuUrl } from './meeNu.js'

describe('parseMeeNuUrl', () => {
  const blogUrls: Array<string> = [
    'https://alice.mee.nu/',
    'https://alice.mee.nu/archives/1234',
    'http://alice.mee.nu/',
    'https://alice-bob.mee.nu/',
  ]

  it.each(blogUrls)('should return the blog for %s', (url) => {
    const expected: MeeNuUrl = { kind: 'blog' }

    expect(parseMeeNuUrl(url)).toEqual(expected)
  })

  const otherUrls: Array<string> = [
    'https://mee.nu/',
    'https://www.mee.nu/',
    'https://files.mee.nu/',
    'https://images.mee.nu/',
    'https://mail.mee.nu/',
    'https://scripts.mee.nu/',
    'https://smilies.mee.nu/',
    'https://www.alice.mee.nu/',
    'https://alice.example.com/',
  ]

  it.each(otherUrls)('should return undefined for %s', (url) => {
    expect(parseMeeNuUrl(url)).toBeUndefined()
  })
})

describe('meeNuHandler', () => {
  describe('match', () => {
    it('should return true for a blog', () => {
      expect(meeNuHandler.match('https://alice.mee.nu/')).toBe(true)
    })

    it('should return false for another host', () => {
      expect(meeNuHandler.match('https://example.com/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside mee.nu', () => {
      expect(meeNuHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS and Atom posts feeds for blog', () => {
      const value = 'https://alice.mee.nu/archives/1234'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.mee.nu/feed/rss',
          hint: { key: 'mee-nu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.mee.nu/feed/atom',
          hint: { key: 'mee-nu:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(meeNuHandler.resolve(value)).toEqual(expected)
    })

    it('should take the scheme of the base href', () => {
      const value = 'https://alice.mee.nu/'
      const content = `
        <base
          href="http://alice.mee.nu/"
          target="_self"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://alice.mee.nu/feed/rss',
          hint: { key: 'mee-nu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'http://alice.mee.nu/feed/atom',
          hint: { key: 'mee-nu:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(meeNuHandler.resolve(value, content)).toEqual(expected)
    })

    it('should ignore a base href on another host', () => {
      const value = 'https://alice.mee.nu/'
      const content = `
        <base
          href="http://bob.mee.nu/"
          target="_self"
        >
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://alice.mee.nu/feed/rss',
          hint: { key: 'mee-nu:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://alice.mee.nu/feed/atom',
          hint: { key: 'mee-nu:posts', label: 'Posts', format: 'atom' },
        },
      ]

      expect(meeNuHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
