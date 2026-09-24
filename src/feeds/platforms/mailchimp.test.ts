import { describe, expect, it } from 'bun:test'
import { mailchimpHandler } from './mailchimp.js'

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

    it('should return an empty array for invalid URLs', () => {
      expect(mailchimpHandler.resolve('not-a-url')).toEqual([])
    })
  })
})
