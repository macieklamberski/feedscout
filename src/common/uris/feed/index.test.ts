import { describe, expect, it } from 'bun:test'
import { omitEmpty } from '../../utils.js'
import { discoverUrisFromFeed } from './index.js'

describe('discoverUrisFromFeed', () => {
  it('should extract icon from Atom feed', () => {
    const content = `<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example</title>
        <icon>https://example.com/icon.png</icon>
        <id>urn:uuid:1</id>
        <updated>2024-01-01T00:00:00Z</updated>
      </feed>`
    const value = discoverUrisFromFeed(content, {
      extractUrls: ({ format, feed }) => {
        if (format === 'atom') {
          return omitEmpty([feed.icon])
        }
        return []
      },
    })
    const expected = ['https://example.com/icon.png']

    expect(value).toEqual(expected)
  })

  it('should extract favicon and icon from JSON Feed', () => {
    const content = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example',
      favicon: 'https://example.com/favicon.ico',
      icon: 'https://example.com/icon.png',
      items: [],
    })
    const value = discoverUrisFromFeed(content, {
      extractUrls: ({ format, feed }) => {
        if (format === 'json') {
          return omitEmpty([feed.favicon, feed.icon])
        }
        return []
      },
    })
    const expected = ['https://example.com/favicon.ico', 'https://example.com/icon.png']

    expect(value).toEqual(expected)
  })

  it('should return empty array for RSS feed', () => {
    const content = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Example</title>
          <link>https://example.com</link>
        </channel>
      </rss>`
    const value = discoverUrisFromFeed(content, {
      extractUrls: ({ format }) => {
        if (format === 'atom' || format === 'json') {
          return ['should-not-reach']
        }
        return []
      },
    })

    expect(value).toEqual([])
  })

  it('should return empty array for invalid content', () => {
    const value = discoverUrisFromFeed('not a feed', {
      extractUrls: () => ['should-not-reach'],
    })

    expect(value).toEqual([])
  })

  it('should filter out empty and undefined values', () => {
    const content = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example',
      favicon: 'https://example.com/favicon.ico',
      items: [],
    })
    const value = discoverUrisFromFeed(content, {
      extractUrls: ({ format, feed }) => {
        if (format === 'json') {
          return omitEmpty([feed.favicon, feed.icon])
        }
        return []
      },
    })
    const expected = ['https://example.com/favicon.ico']

    expect(value).toEqual(expected)
  })
})
