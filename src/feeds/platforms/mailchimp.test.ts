import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import {
  getMailchimpPage,
  type MailchimpPage,
  type MailchimpUrl,
  mailchimpHandler,
  parseMailchimpUrl,
} from './mailchimp.js'

describe('parseMailchimpUrl', () => {
  it('should return the archive for a campaign archive page', () => {
    const expected: MailchimpUrl = { kind: 'archive', userId: 'abc', listId: 'def' }

    expect(parseMailchimpUrl('https://us1.campaign-archive.com/home/?u=abc&id=def')).toEqual(
      expected,
    )
  })

  it('should return the campaign for a single campaign page', () => {
    const expected: MailchimpUrl = { kind: 'campaign', userId: 'abc' }

    expect(parseMailchimpUrl('https://us1.campaign-archive.com/?u=abc&id=def')).toEqual(expected)
  })

  it('should return undefined without the list id', () => {
    expect(parseMailchimpUrl('https://us1.campaign-archive.com/home/?u=abc')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseMailchimpUrl('https://example.com/')).toBeUndefined()
  })
})

describe('getMailchimpPage', () => {
  const campaignUrl = 'https://us1.campaign-archive.com/?u=abc123def456&id=9a8b7c6d5e'

  it('should return the list of an archive page from the url', () => {
    const value = 'https://us1.campaign-archive.com/home/?u=abc123def456&id=0f1e2d3c4b'
    const expected: MailchimpPage = {
      kind: 'archive',
      userId: 'abc123def456',
      listId: '0f1e2d3c4b',
    }

    expect(getMailchimpPage(value, undefined)).toEqual(expected)
  })

  it('should return the list a campaign page links as its archive', () => {
    const content =
      '<a href="https://us1.campaign-archive.com/home/?u=abc123def456&amp;id=0f1e2d3c4b">Past issues</a>'
    const expected: MailchimpPage = {
      kind: 'campaign',
      userId: 'abc123def456',
      listId: '0f1e2d3c4b',
    }

    expect(getMailchimpPage(campaignUrl, content)).toEqual(expected)
  })

  it('should return the list a campaign page links as its feed', () => {
    const content =
      '<a href="https://us1.campaign-archive.com/feed?u=abc123def456&id=0f1e2d3c4b">RSS</a>'
    const expected: MailchimpPage = {
      kind: 'campaign',
      userId: 'abc123def456',
      listId: '0f1e2d3c4b',
    }

    expect(getMailchimpPage(campaignUrl, content)).toEqual(expected)
  })

  it('should return undefined for a campaign page without content', () => {
    expect(getMailchimpPage(campaignUrl, undefined)).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(getMailchimpPage('https://example.com/', undefined)).toBeUndefined()
  })

  it('should return undefined for a campaign page without an archive or feed link', () => {
    expect(getMailchimpPage(campaignUrl, '<p>Monthly update</p>')).toBeUndefined()
  })
})

describe('mailchimpHandler', () => {
  describe('match', () => {
    it('should match an archive URL carrying both ids', () => {
      const value = 'https://us17.campaign-archive.com/home/?u=abc123&id=def456'

      expect(mailchimpHandler.match(value)).toBe(true)
    })

    it('should match a single campaign URL', () => {
      const value = 'https://us17.campaign-archive.com/?u=abc123&id=def456&e=xyz'

      expect(mailchimpHandler.match(value)).toBe(true)
    })

    it('should not match without both ids', () => {
      expect(mailchimpHandler.match('https://us17.campaign-archive.com/?u=abc123')).toBe(false)
      expect(mailchimpHandler.match('https://us17.campaign-archive.com/')).toBe(false)
    })

    it('should not match other hosts', () => {
      expect(mailchimpHandler.match('https://example.com/?u=abc123&id=def456')).toBe(false)
    })

    it('should not match invalid URLs', () => {
      expect(mailchimpHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should keep a list id with # inside the id query value', () => {
      const value = 'https://us1.campaign-archive.com/home/?u=abc&id=def%23x'
      const expected = [
        {
          uri: 'https://us1.campaign-archive.com/feed?u=abc&id=def%23x',
          hint: { key: 'mailchimp:archive', label: 'Archive' },
        },
      ]

      expect(mailchimpHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Mailchimp', () => {
      expect(mailchimpHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return the archive feed on the same datacentre host', () => {
      const value = 'https://us17.campaign-archive.com/home/?u=abc123&id=def456'
      const expected = [
        {
          uri: 'https://us17.campaign-archive.com/feed?u=abc123&id=def456',
          hint: { key: 'mailchimp:archive', label: 'Archive' },
        },
      ]

      expect(mailchimpHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feed of the list a campaign page links', () => {
      const value = 'https://us17.campaign-archive.com/?u=abc123&id=def456'
      const content = `
        <a
          class="rss"
          href="https://us17.campaign-archive.com/feed?u=abc123&amp;id=fed789"
        >RSS</a>
      `
      const expected = [
        {
          uri: 'https://us17.campaign-archive.com/feed?u=abc123&id=fed789',
          hint: { key: 'mailchimp:archive', label: 'Archive' },
        },
      ]

      expect(mailchimpHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the feed of the archive a campaign page links', () => {
      const value = 'https://us17.campaign-archive.com/?u=abc123&id=def456'
      const content = `
        <a
          href="https://us17.campaign-archive.com/home/?u=abc123&amp;id=fed789"
          title="View Past Issues"
        >Past Issues</a>
      `
      const expected = [
        {
          uri: 'https://us17.campaign-archive.com/feed?u=abc123&id=fed789',
          hint: { key: 'mailchimp:archive', label: 'Archive' },
        },
      ]

      expect(mailchimpHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return an empty array for a campaign page that links no list', () => {
      const value = 'https://us17.campaign-archive.com/?u=abc123&id=def456'
      const content = '<p>Monthly update</p>'

      expect(mailchimpHandler.resolve(value, content)).toEqual([])
    })

    it('should return an empty array for a campaign page without content', () => {
      const value = 'https://us17.campaign-archive.com/?u=abc123&id=def456'

      expect(mailchimpHandler.resolve(value)).toEqual([])
    })

    it('should return an empty array without both ids', () => {
      expect(mailchimpHandler.resolve('https://us17.campaign-archive.com/?u=abc123')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the archive key for an archive feed', () => {
      const value =
        'https://us17.campaign-archive.com/feed?u=0123456789abcdef012345678&id=0123456789'
      const expected: DiscoverUriHint = { key: 'mailchimp:archive', label: 'Archive' }

      expect(mailchimpHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the archive key for an archive feed with the list id first', () => {
      const value =
        'https://us4.campaign-archive.com/feed?id=fedcba9876&u=fedcba9876543210fedcba987'
      const expected: DiscoverUriHint = { key: 'mailchimp:archive', label: 'Archive' }

      expect(mailchimpHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the archive key for an archive feed over http', () => {
      const value =
        'http://us17.campaign-archive.com/feed?u=abcdef0123456789abcdef012&id=abcdef0123'
      const expected: DiscoverUriHint = { key: 'mailchimp:archive', label: 'Archive' }

      expect(mailchimpHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for an archive page', () => {
      const value =
        'https://us17.campaign-archive.com/home/?u=0123456789abcdef012345678&id=0123456789'

      expect(mailchimpHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a campaign page', () => {
      const value = 'https://us17.campaign-archive.com/?u=0123456789abcdef012345678&id=0123456789'

      expect(mailchimpHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed without the list id', () => {
      const value = 'https://us17.campaign-archive.com/feed?u=0123456789abcdef012345678'

      expect(mailchimpHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/feed?u=0123456789abcdef012345678&id=0123456789'

      expect(mailchimpHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const hint: DiscoverUriHint = { key: 'mailchimp:archive', label: 'Archive' }
    const ownFeeds: Array<string> = [
      'https://us17.campaign-archive.com/feed?u=0123456789abcdef012345678&id=0123456789',
      'https://us17.campaign-archive.com/feed?u=abcdef0123456789abcdef012&id=abcdef0123',
      'https://us4.campaign-archive.com/feed?id=fedcba9876&u=fedcba9876543210fedcba987',
    ]

    it.each(ownFeeds)('should return %s as itself', async (value) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [mailchimpHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
