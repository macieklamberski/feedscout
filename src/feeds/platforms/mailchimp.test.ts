import { describe, expect, it } from 'bun:test'
import { type MailchimpUrl, mailchimpHandler, parseMailchimpUrl } from './mailchimp.js'

describe('parseMailchimpUrl', () => {
  it('should return the archive for a campaign archive page', () => {
    const expected: MailchimpUrl = { kind: 'archive', userId: 'abc', listId: 'def' }

    expect(parseMailchimpUrl('https://us1.campaign-archive.com/home/?u=abc&id=def')).toEqual(
      expected,
    )
  })

  it('should return undefined without the list id', () => {
    expect(parseMailchimpUrl('https://us1.campaign-archive.com/home/?u=abc')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseMailchimpUrl('https://example.com/')).toBeUndefined()
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

    it('should return an empty array without both ids', () => {
      expect(mailchimpHandler.resolve('https://us17.campaign-archive.com/?u=abc123')).toEqual([])
    })
  })
})
