import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { getPubliiPage, isPubliiHtml, type PubliiPage, publiiHandler } from './publii.js'

const publiiHtml = '<meta name="generator" content="Publii Open-Source CMS for Static Site">'
const otherHtml = '<meta name="generator" content="Hugo 0.120">'

describe('isPubliiHtml', () => {
  it('should return true for the Publii generator meta tag', () => {
    expect(isPubliiHtml(publiiHtml)).toBe(true)
  })

  it('should return true for media under the site root', () => {
    const value = '<img src="https://example.com/media/website/logo.png">'

    expect(isPubliiHtml(value)).toBe(true)
  })

  it('should return false for another generator', () => {
    expect(isPubliiHtml(otherHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPubliiHtml('')).toBe(false)
  })
})

describe('getPubliiPage', () => {
  const mediaHtml = '<img src="https://example.com/blog/media/posts/12/cover.jpg">'
  const cdnMediaHtml = '<img src="https://cdn.example.org/media/posts/12/cover.jpg">'

  it('should return the site root a media link names', () => {
    const value = 'https://example.com/blog/first-post.html'
    const expected: PubliiPage = { kind: 'site', siteUrl: 'https://example.com/blog' }

    expect(getPubliiPage(value, mediaHtml)).toEqual(expected)
  })

  it('should return the origin for a page with the generator meta alone', () => {
    const value = 'https://example.com/blog/first-post.html'
    const expected: PubliiPage = { kind: 'site', siteUrl: 'https://example.com' }

    expect(getPubliiPage(value, publiiHtml)).toEqual(expected)
  })

  it('should return undefined without content', () => {
    expect(getPubliiPage('https://example.com/blog/first-post.html', undefined)).toBeUndefined()
  })

  it('should return undefined for a media link on another host without the generator meta', () => {
    expect(getPubliiPage('https://example.com/first-post.html', cdnMediaHtml)).toBeUndefined()
  })

  it('should return the origin for a media link on another host with the generator meta', () => {
    const value = 'https://example.com/first-post.html'
    const expected: PubliiPage = { kind: 'site', siteUrl: 'https://example.com' }

    expect(getPubliiPage(value, `${publiiHtml}${cdnMediaHtml}`)).toEqual(expected)
  })

  it('should return the site root a media link names on the www host', () => {
    const value = 'https://example.com/blog/first-post.html'
    const content = '<img src="https://www.example.com/blog/media/website/logo.png">'
    const expected: PubliiPage = { kind: 'site', siteUrl: 'https://www.example.com/blog' }

    expect(getPubliiPage(value, content)).toEqual(expected)
  })

  it('should return undefined for a media link whose root does not hold the page', () => {
    expect(getPubliiPage('https://example.com/other/first-post.html', mediaHtml)).toBeUndefined()
  })
})

describe('publiiHandler', () => {
  describe('match', () => {
    it('should match a Publii page', () => {
      expect(publiiHandler.match('https://example.com/posts/a-post', publiiHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(publiiHandler.match('https://example.com/')).toBe(false)
    })

    it('should match a page under the site root its media links name', () => {
      const content = '<img src="https://example.com/blog/media/website/logo.png">'

      expect(publiiHandler.match('https://example.com/blog/a-post/', content)).toBe(true)
    })

    it('should not match media linked from another host', () => {
      const content = '<img src="https://assets.example.com/media/website/logo.png">'

      expect(publiiHandler.match('https://example.com/', content)).toBe(false)
    })

    it('should not match a page outside the root the media links name', () => {
      const content = '<img src="https://example.com/blog/media/website/logo.png">'

      expect(publiiHandler.match('https://example.com/shop/', content)).toBe(false)
    })

    it('should not match post media outside a numbered folder', () => {
      const content =
        '<meta property="og:image" content="https://example.com/media/posts/cover.jpg">'

      expect(publiiHandler.match('https://example.com/2024/hello/', content)).toBe(false)
    })

    it('should not match another platform', () => {
      expect(publiiHandler.match('https://example.com/', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the Atom and JSON feeds', () => {
      const value = 'https://example.com/posts/a-post'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/feed.xml',
          hint: { key: 'publii:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.com/feed.json',
          hint: { key: 'publii:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(publiiHandler.resolve(value, publiiHtml)).toEqual(expected)
    })

    it('should build the feeds from the site root the media links name', () => {
      const value = 'https://example.com/blog/some-post/'
      const content = '<img src="https://example.com/blog/media/posts/12/cover.jpg">'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/blog/feed.xml',
          hint: { key: 'publii:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.com/blog/feed.json',
          hint: { key: 'publii:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(publiiHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return no feeds for a page outside the root the media links name', () => {
      const value = 'https://example.com/shop/'
      const content = '<img src="https://example.com/blog/media/website/logo.png">'

      expect(publiiHandler.resolve(value, content)).toEqual([])
    })
  })
})
