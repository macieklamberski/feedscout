import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type MailArchiveUrl, mailArchiveHandler, parseMailArchiveUrl } from './mailArchive.js'

describe('parseMailArchiveUrl', () => {
  it('should return the list for a list index', () => {
    const expected: MailArchiveUrl = { kind: 'list', list: 'gnupg-users@gnupg.org' }

    expect(parseMailArchiveUrl('https://www.mail-archive.com/gnupg-users@gnupg.org/')).toEqual(
      expected,
    )
  })

  it('should return the list for a message page', () => {
    const value = 'https://www.mail-archive.com/gnupg-users@gnupg.org/msg43000.html'
    const expected: MailArchiveUrl = { kind: 'list', list: 'gnupg-users@gnupg.org' }

    expect(parseMailArchiveUrl(value)).toEqual(expected)
  })

  it('should return the list on the apex host', () => {
    const expected: MailArchiveUrl = { kind: 'list', list: 'dnsop@ietf.org' }

    expect(parseMailArchiveUrl('https://mail-archive.com/dnsop@ietf.org/info.html')).toEqual(
      expected,
    )
  })

  it('should keep a percent-encoded list address as written', () => {
    const expected: MailArchiveUrl = { kind: 'list', list: 'dnsop%40ietf.org' }

    expect(parseMailArchiveUrl('https://www.mail-archive.com/dnsop%40ietf.org/')).toEqual(expected)
  })

  it('should return undefined for a site page', () => {
    expect(parseMailArchiveUrl('https://www.mail-archive.com/faq.html')).toBeUndefined()
  })

  it('should return undefined for the search page', () => {
    const value = 'https://www.mail-archive.com/search?l=gnupg-users@gnupg.org&q=key'

    expect(parseMailArchiveUrl(value)).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseMailArchiveUrl('https://www.mail-archive.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseMailArchiveUrl('https://example.com/gnupg-users@gnupg.org/')).toBeUndefined()
  })
})

describe('mailArchiveHandler', () => {
  describe('match', () => {
    it('should match a message page', () => {
      const value = 'https://www.mail-archive.com/gnupg-users@gnupg.org/msg43000.html'

      expect(mailArchiveHandler.match(value)).toBe(true)
    })

    it('should not match a site page', () => {
      expect(mailArchiveHandler.match('https://www.mail-archive.com/faq.html')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside The Mail Archive', () => {
      expect(mailArchiveHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should encode a space in the list name', () => {
      const value = 'https://www.mail-archive.com/a%20b@example.org/msg1.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.mail-archive.com/a%20b@example.org/maillist.xml',
          hint: { key: 'mail-archive:list', label: 'Mailing list' },
        },
      ]

      expect(mailArchiveHandler.resolve(value)).toEqual(expected)
    })

    it('should return the list feed for a message page', () => {
      const value = 'https://www.mail-archive.com/gnupg-users@gnupg.org/msg43000.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://www.mail-archive.com/gnupg-users@gnupg.org/maillist.xml',
          hint: { key: 'mail-archive:list', label: 'Mailing list' },
        },
      ]

      expect(mailArchiveHandler.resolve(value)).toEqual(expected)
    })

    it('should return the list feed on the apex host', () => {
      const value = 'https://mail-archive.com/dnsop@ietf.org/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://mail-archive.com/dnsop@ietf.org/maillist.xml',
          hint: { key: 'mail-archive:list', label: 'Mailing list' },
        },
      ]

      expect(mailArchiveHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a percent-encoded at sign in the list address', () => {
      const value = 'https://www.mail-archive.com/dev%40example.org/'
      const expected = [
        {
          uri: 'https://www.mail-archive.com/dev%40example.org/maillist.xml',
          hint: { key: 'mail-archive:list', label: 'Mailing list' },
        },
      ]

      expect(mailArchiveHandler.resolve(value)).toEqual(expected)
    })

    it('should keep a percent-encoded slash in the list address as written', () => {
      const value = 'https://www.mail-archive.com/dev%2Fnull@example.org/'
      const expected = [
        {
          uri: 'https://www.mail-archive.com/dev%2Fnull@example.org/maillist.xml',
          hint: { key: 'mail-archive:list', label: 'Mailing list' },
        },
      ]

      expect(mailArchiveHandler.resolve(value)).toEqual(expected)
    })

    it('should keep the http scheme of the page', () => {
      const value = 'http://www.mail-archive.com/alice@example.org/msg1.html'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'http://www.mail-archive.com/alice@example.org/maillist.xml',
          hint: { key: 'mail-archive:list', label: 'Mailing list' },
        },
      ]

      expect(mailArchiveHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the list hint for a list feed', () => {
      const value = 'https://www.mail-archive.com/alice@example.org/maillist.xml'
      const expected: DiscoverUriHint = { key: 'mail-archive:list', label: 'Mailing list' }

      expect(mailArchiveHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the list hint for a list feed on the apex host', () => {
      const value = 'https://mail-archive.com/alice@lists.example.org/maillist.xml'
      const expected: DiscoverUriHint = { key: 'mail-archive:list', label: 'Mailing list' }

      expect(mailArchiveHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the list hint for a list feed over http', () => {
      const value = 'http://www.mail-archive.com/alice@example.org/maillist.xml'
      const expected: DiscoverUriHint = { key: 'mail-archive:list', label: 'Mailing list' }

      expect(mailArchiveHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the list hint for a list feed with a percent-encoded at sign', () => {
      const value = 'https://www.mail-archive.com/alice%40example.org/maillist.xml'
      const expected: DiscoverUriHint = { key: 'mail-archive:list', label: 'Mailing list' }

      expect(mailArchiveHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the list hint for an rdf list feed', () => {
      const value = 'https://mail-archive.com/alice@example.org/maillist.rdf'
      const expected: DiscoverUriHint = {
        key: 'mail-archive:list',
        label: 'Mailing list',
        format: 'rdf',
      }

      expect(mailArchiveHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a list page', () => {
      const value = 'https://www.mail-archive.com/alice@example.org/msg1.html'

      expect(mailArchiveHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path under a segment without an at sign', () => {
      const value = 'https://www.mail-archive.com/faq/maillist.xml'

      expect(mailArchiveHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/alice@example.org/maillist.xml'

      expect(mailArchiveHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://www.mail-archive.com/alice@example.org/maillist.xml',
        { key: 'mail-archive:list', label: 'Mailing list' },
      ],
      [
        'https://mail-archive.com/alice@example.org/maillist.xml/',
        { key: 'mail-archive:list', label: 'Mailing list' },
      ],
      [
        'https://mail-archive.com/alice@example.org/maillist.rdf',
        { key: 'mail-archive:list', label: 'Mailing list', format: 'rdf' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [mailArchiveHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
