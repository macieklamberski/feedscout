import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  isNoticeableHtml,
  type NoticeableUrl,
  noticeableHandler,
  parseNoticeableUrl,
} from './noticeable.js'

const noticeableHtml = `
  <link
    rel="stylesheet"
    href="https://assets.noticeable.news/templates/noticeone/css/main.min.css"
  >
`

describe('isNoticeableHtml', () => {
  it('should return true for a Noticeable template stylesheet', () => {
    expect(isNoticeableHtml(noticeableHtml)).toBe(true)
  })

  it('should return false for another stylesheet', () => {
    const value = '<link rel="stylesheet" href="https://example.com/css/main.min.css">'

    expect(isNoticeableHtml(value)).toBe(false)
  })

  it('should return false for the widget loader', () => {
    const value = '<script src="https://sdk.noticeable.io/l.js" async></script>'

    expect(isNoticeableHtml(value)).toBe(false)
  })
})

describe('parseNoticeableUrl', () => {
  it('should return the label for a label page', () => {
    const expected: NoticeableUrl = { kind: 'label', label: 'bug-fix' }

    expect(parseNoticeableUrl('https://example.noticeable.news/labels/bug-fix')).toEqual(expected)
  })

  it('should return the label for a label page with a trailing slash', () => {
    const expected: NoticeableUrl = { kind: 'label', label: 'bug-fix' }

    expect(parseNoticeableUrl('https://example.noticeable.news/labels/bug-fix/')).toEqual(expected)
  })

  it('should return the label for a label page with an uppercase route word', () => {
    const expected: NoticeableUrl = { kind: 'label', label: 'bug-fix' }

    expect(parseNoticeableUrl('https://example.noticeable.news/Labels/bug-fix')).toEqual(expected)
  })

  it('should return the newspage for the home page', () => {
    const expected: NoticeableUrl = { kind: 'newspage' }

    expect(parseNoticeableUrl('https://example.noticeable.news/')).toEqual(expected)
  })

  it('should return the newspage for a publication page', () => {
    const value = 'https://example.noticeable.news/publications/new-billing-api'
    const expected: NoticeableUrl = { kind: 'newspage' }

    expect(parseNoticeableUrl(value)).toEqual(expected)
  })

  it('should return the newspage for a page combining labels', () => {
    const expected: NoticeableUrl = { kind: 'newspage' }

    expect(parseNoticeableUrl('https://example.noticeable.news/labels/api,bug-fix')).toEqual(
      expected,
    )
  })

  it('should return the newspage for the label index', () => {
    const expected: NoticeableUrl = { kind: 'newspage' }

    expect(parseNoticeableUrl('https://example.noticeable.news/labels/')).toEqual(expected)
  })

  it('should return undefined for a nested subdomain', () => {
    expect(parseNoticeableUrl('https://news.example.noticeable.news/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseNoticeableUrl('not-a-url')).toBeUndefined()
  })
})

describe('noticeableHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://example.noticeable.news/'],
      [true, 'https://example.noticeable.news/labels/bug-fix'],
      [false, 'https://noticeable.news/'],
      [false, 'https://www.noticeable.news/'],
      [false, 'https://example.com/labels/bug-fix'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(noticeableHandler.match(url)).toBe(expected)
    })

    it('should match a custom domain with the Noticeable template', () => {
      expect(noticeableHandler.match('https://changelog.example.com/', noticeableHtml)).toBe(true)
    })
  })

  describe('resolve', () => {
    it('should return the label and newspage feeds for a label page', () => {
      const value = 'https://example.noticeable.news/labels/bug-fix'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.noticeable.news/bug-fix.rss',
          hint: { key: 'noticeable:label', label: 'Label', format: 'rss' },
        },
        {
          uri: 'https://example.noticeable.news/bug-fix.atom',
          hint: { key: 'noticeable:label', label: 'Label', format: 'atom' },
        },
        {
          uri: 'https://example.noticeable.news/bug-fix.json',
          hint: { key: 'noticeable:label', label: 'Label', format: 'json' },
        },
        {
          uri: 'https://example.noticeable.news/feed.rss',
          hint: { key: 'noticeable:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://example.noticeable.news/feed.atom',
          hint: { key: 'noticeable:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://example.noticeable.news/feed.json',
          hint: { key: 'noticeable:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(noticeableHandler.resolve(value)).toEqual(expected)
    })

    it('should return the newspage feeds for a custom domain', () => {
      const value = 'https://changelog.example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://changelog.example.com/feed.rss',
          hint: { key: 'noticeable:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://changelog.example.com/feed.atom',
          hint: { key: 'noticeable:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://changelog.example.com/feed.json',
          hint: { key: 'noticeable:posts', label: 'Posts', format: 'json' },
        },
      ]

      expect(noticeableHandler.resolve(value, noticeableHtml)).toEqual(expected)
    })

    it('should return empty array for an invalid URL', () => {
      expect(noticeableHandler.resolve('not-a-url')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the posts hint for a newspage RSS feed', () => {
      const value = 'https://bcdevchangelog.noticeable.news/feed.rss'
      const expected: DiscoverUriHint = { key: 'noticeable:posts', label: 'Posts', format: 'rss' }

      expect(noticeableHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a newspage Atom feed', () => {
      const value = 'https://synthesia.noticeable.news/feed.atom'
      const expected: DiscoverUriHint = { key: 'noticeable:posts', label: 'Posts', format: 'atom' }

      expect(noticeableHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a newspage JSON feed', () => {
      const value = 'https://bcdevchangelog.noticeable.news/feed.json'
      const expected: DiscoverUriHint = { key: 'noticeable:posts', label: 'Posts', format: 'json' }

      expect(noticeableHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a newspage feed over http', () => {
      const value = 'http://bcdevchangelog.noticeable.news/feed.rss'
      const expected: DiscoverUriHint = { key: 'noticeable:posts', label: 'Posts', format: 'rss' }

      expect(noticeableHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a newspage feed with an embed parameter', () => {
      const value = 'https://bcdevchangelog.noticeable.news/feed.rss?embed=true'
      const expected: DiscoverUriHint = { key: 'noticeable:posts', label: 'Posts', format: 'rss' }

      expect(noticeableHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the label hint for a label RSS feed', () => {
      const value = 'https://bcdevchangelog.noticeable.news/cornerstone.rss'
      const expected: DiscoverUriHint = { key: 'noticeable:label', label: 'Label', format: 'rss' }

      expect(noticeableHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the label hint for a label Atom feed', () => {
      const value = 'https://synthesia.noticeable.news/templates.atom'
      const expected: DiscoverUriHint = { key: 'noticeable:label', label: 'Label', format: 'atom' }

      expect(noticeableHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the label hint for a label JSON feed', () => {
      const value = 'https://bcdevchangelog.noticeable.news/cornerstone.json'
      const expected: DiscoverUriHint = { key: 'noticeable:label', label: 'Label', format: 'json' }

      expect(noticeableHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a label page', () => {
      const value = 'https://bcdevchangelog.noticeable.news/labels/cornerstone'

      expect(noticeableHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a publication page', () => {
      const value = 'https://example.noticeable.news/publications/new-billing-api'

      expect(noticeableHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on the Noticeable site', () => {
      const value = 'https://noticeable.news/feed.rss'

      expect(noticeableHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on a nested subdomain', () => {
      const value = 'https://news.example.noticeable.news/feed.rss'

      expect(noticeableHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://acme.noticeable.io/feed.rss'

      expect(noticeableHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://bcdevchangelog.noticeable.news/feed.rss',
        { key: 'noticeable:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://bcdevchangelog.noticeable.news/feed.atom',
        { key: 'noticeable:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://bcdevchangelog.noticeable.news/feed.json',
        { key: 'noticeable:posts', label: 'Posts', format: 'json' },
      ],
      [
        'https://bcdevchangelog.noticeable.news/cornerstone.rss',
        { key: 'noticeable:label', label: 'Label', format: 'rss' },
      ],
      [
        'https://bcdevchangelog.noticeable.news/cornerstone.atom',
        { key: 'noticeable:label', label: 'Label', format: 'atom' },
      ],
      [
        'https://bcdevchangelog.noticeable.news/cornerstone.json',
        { key: 'noticeable:label', label: 'Label', format: 'json' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [noticeableHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
