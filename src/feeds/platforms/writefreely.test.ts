import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isWritefreelyHtml, writefreelyHandler } from './writefreely.js'

const writefreelyHtml = '<meta name="generator" content="WriteFreely">'
const otherHtml = '<meta name="generator" content="Ghost 5.0">'

describe('isWritefreelyHtml', () => {
  it('should return true for the WriteFreely generator meta tag', () => {
    expect(isWritefreelyHtml(writefreelyHtml)).toBe(true)
  })

  it('should return true for the stylesheet a theme keeps', () => {
    expect(isWritefreelyHtml('<link rel="stylesheet" href="/css/write.css?v=1" />')).toBe(true)
  })

  it('should return true for a single-quoted stylesheet link', () => {
    const value = `
      <link
        rel='stylesheet'
        href='/css/write.css?v=1'
      />
    `

    expect(isWritefreelyHtml(value)).toBe(true)
  })

  it('should return true for a Write.as blog on its own domain', () => {
    expect(isWritefreelyHtml('<meta name="generator" content="Write.as">')).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isWritefreelyHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isWritefreelyHtml('')).toBe(false)
  })
})

describe('writefreelyHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(writefreelyHandler.match('https://example.org/alice', writefreelyHtml)).toBe(true)
    })

    it('should not match the instance root', () => {
      expect(writefreelyHandler.match('https://example.org/', writefreelyHtml)).toBe(false)
    })

    it('should not match the reader path', () => {
      expect(writefreelyHandler.match('https://example.org/read', writefreelyHtml)).toBe(false)
    })

    it('should not match a capitalized reader path', () => {
      expect(writefreelyHandler.match('https://example.org/Read', writefreelyHtml)).toBe(false)
    })

    it('should not match without content', () => {
      expect(writefreelyHandler.match('https://example.org/alice')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(writefreelyHandler.match('not-a-url', writefreelyHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the blog and reader feeds', () => {
      const value = 'https://example.org/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/alice/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.org/read/feed/',
          hint: { key: 'writefreely:reader', label: 'Reader' },
        },
      ]

      expect(writefreelyHandler.resolve(value)).toEqual(expected)
    })

    it('should use the blog name from a post page', () => {
      const value = 'https://example.org/alice/a-post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/alice/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.org/read/feed/',
          hint: { key: 'writefreely:reader', label: 'Reader' },
        },
      ]

      expect(writefreelyHandler.resolve(value)).toEqual(expected)
    })

    it('should add the tag feed for a tag page', () => {
      const value = 'https://example.org/alice/tag:coolify'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/alice/tag:coolify/feed/',
          hint: { key: 'writefreely:tag', label: 'Tag' },
        },
        {
          uri: 'https://example.org/alice/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.org/read/feed/',
          hint: { key: 'writefreely:reader', label: 'Reader' },
        },
      ]

      expect(writefreelyHandler.resolve(value)).toEqual(expected)
    })

    it('should build the feeds of a single-user instance from the blog title link', () => {
      const value = 'https://example.org/a-post'
      const content = '<h1 id="blog-title"><a href="/" class="h-card p-author">Blog</a></h1>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
      ]

      expect(writefreelyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should build the feeds of a single-user instance from a single-quoted blog title', () => {
      const value = 'https://example.org/a-post'
      const content = "<h1 id='blog-title'><a href='/'>Blog</a></h1>"
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
      ]

      expect(writefreelyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should build the tag feed of a single-user instance', () => {
      const value = 'https://example.org/tag:coolify'
      const content = '<h1 id="blog-title"><a href="/" class="h-card p-author">Blog</a></h1>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/tag:coolify/feed/',
          hint: { key: 'writefreely:tag', label: 'Tag' },
        },
        {
          uri: 'https://example.org/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
      ]

      expect(writefreelyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should build the tag feed of a single-user instance with a capitalized tag segment', () => {
      const value = 'https://example.org/Tag:coolify'
      const content = '<h1 id="blog-title"><a href="/" class="h-card p-author">Blog</a></h1>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/tag:coolify/feed/',
          hint: { key: 'writefreely:tag', label: 'Tag' },
        },
        {
          uri: 'https://example.org/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
      ]

      expect(writefreelyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should build the tag feed of a single-user instance without a blog title link', () => {
      const value = 'https://example.org/tag:coolify'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/tag:coolify/feed/',
          hint: { key: 'writefreely:tag', label: 'Tag' },
        },
        {
          uri: 'https://example.org/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
      ]

      expect(writefreelyHandler.resolve(value)).toEqual(expected)
    })

    it('should build the tag feed of a single-user instance from an uppercase tag segment without a blog title link', () => {
      const value = 'https://example.org/TAG:coolify'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/tag:coolify/feed/',
          hint: { key: 'writefreely:tag', label: 'Tag' },
        },
        {
          uri: 'https://example.org/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
      ]

      expect(writefreelyHandler.resolve(value)).toEqual(expected)
    })

    it('should fall back to the blog name when the blog title links elsewhere', () => {
      const value = 'https://example.org/alice/a-post'
      const content = '<h1 id="blog-title"><a href="https://alice.example.com/">Blog</a></h1>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.org/alice/feed/',
          hint: { key: 'writefreely:blog', label: 'Blog' },
        },
        {
          uri: 'https://example.org/read/feed/',
          hint: { key: 'writefreely:reader', label: 'Reader' },
        },
      ]

      expect(writefreelyHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return an empty array for the instance root', () => {
      expect(writefreelyHandler.resolve('https://example.org/')).toEqual([])
    })
  })
})
