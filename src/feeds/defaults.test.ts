import { describe, expect, it } from 'bun:test'
import { discoverUrisFromHtml } from '../common/uris/html/index.js'
import { defaultHtmlOptions } from './defaults.js'

describe('defaultHtmlOptions ignores subscribe/share links that wrap a feed URL', () => {
  const wrappers = [
    'https://add.my.yahoo.com/content?url=http%3A%2F%2Fexample.com%2Ffeed',
    'https://www.netvibes.com/subscribe.php?url=http%3A%2F%2Fexample.com%2Ffeed',
    'https://podcasts.google.com/?feed=aHR0cDovL2V4YW1wbGUuY29tL2ZlZWQ',
    'http://apicdn.viglink.com/api/click?u=http%3A%2F%2Fexample.com%2Ffeed',
    'http://www.addthis.com/feed.php?h1=http%3A%2F%2Fexample.com%2Ffeed',
  ]

  for (const href of wrappers) {
    it(`ignores ${href}`, () => {
      const value = `<a href="${href}">Subscribe via RSS</a>`
      const expected: Array<string> = []

      expect(discoverUrisFromHtml(value, defaultHtmlOptions)).toEqual(expected)
    })
  }

  it('still discovers a same-site feed link matched by label', () => {
    const value = '<a href="https://example.com/feed">RSS</a>'
    const expected = ['https://example.com/feed']

    expect(discoverUrisFromHtml(value, defaultHtmlOptions)).toEqual(expected)
  })

  it('still discovers a WordPress query feed (no embedded URL)', () => {
    const value = '<a href="https://example.com/?feed=rss">RSS</a>'
    const expected = ['https://example.com/?feed=rss']

    expect(discoverUrisFromHtml(value, defaultHtmlOptions)).toEqual(expected)
  })
})

describe('defaultHtmlOptions matches feed path segments in the pathname only', () => {
  it('discovers an anchor with a feed segment in the path', () => {
    const value = '<a href="https://example.com/rss/news.xml"><svg></svg></a>'
    const expected = ['https://example.com/rss/news.xml']

    expect(discoverUrisFromHtml(value, defaultHtmlOptions)).toEqual(expected)
  })

  it('ignores a feed segment that only appears in the query string', () => {
    const value = '<a href="https://example.com/share?p=/rss/news"><svg></svg></a>'
    const expected: Array<string> = []

    expect(discoverUrisFromHtml(value, defaultHtmlOptions)).toEqual(expected)
  })
})

describe('defaultHtmlOptions does not treat "subscribe" alone as a feed label', () => {
  it('ignores a "Subscribe" link to a podcast app or newsletter', () => {
    const value = '<a href="https://www.youtube.com/c/example">Subscribe</a>'
    const expected: Array<string> = []

    expect(discoverUrisFromHtml(value, defaultHtmlOptions)).toEqual(expected)
  })

  it('still discovers a "Subscribe via RSS" link via the rss label', () => {
    const value = '<a href="https://example.com/updates">Subscribe via RSS</a>'
    const expected = ['https://example.com/updates']

    expect(discoverUrisFromHtml(value, defaultHtmlOptions)).toEqual(expected)
  })
})
