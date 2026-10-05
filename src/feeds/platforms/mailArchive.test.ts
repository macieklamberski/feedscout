import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
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

  it('should decode a percent-encoded list address', () => {
    const expected: MailArchiveUrl = { kind: 'list', list: 'dnsop@ietf.org' }

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
  })
})
