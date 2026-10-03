import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  getPublicInboxPage,
  isPublicInboxHtml,
  type PublicInboxPage,
  publicInboxHandler,
} from './publicInbox.js'

const inboxHtml = `
  <a href="_/text/help/">help</a> /
  <a href="_/text/color/">color</a> /
  <a href="new.atom">Atom feed</a>
`
const messageHtml = `
  <a href="../_/text/help/">help</a> /
  <a href="../_/text/color/">color</a> /
  <a href="../new.atom">Atom feed</a>
`
const threadHtml = `
  <a href="../../_/text/help/">help</a> /
  <a href="../../_/text/color/">color</a> /
  <a href="../../new.atom">Atom feed</a>
`
const messageWithoutSlashHtml = `
  <a href="../_/text/help">help</a> /
  <a href="../_/text/color">color</a> /
  <a href="../new.atom">Atom feed</a>
`
const anubisHtml = `
  <title>Making sure you&#39;re not a bot!</title>
`

describe('isPublicInboxHtml', () => {
  it('should return true for the help and color links', () => {
    expect(isPublicInboxHtml(inboxHtml)).toBe(true)
  })

  it('should return true for the links without a trailing slash', () => {
    expect(isPublicInboxHtml(messageWithoutSlashHtml)).toBe(true)
  })

  it('should return false for a help link alone', () => {
    expect(isPublicInboxHtml('<a href="_/text/help/">help</a>')).toBe(false)
  })

  it('should return false for a bot challenge page', () => {
    expect(isPublicInboxHtml(anubisHtml)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isPublicInboxHtml('')).toBe(false)
  })
})

describe('getPublicInboxPage', () => {
  it('should return the inbox of a list page', () => {
    const value = 'https://lore.barebox.org/barebox/'
    const expected: PublicInboxPage = {
      kind: 'inbox',
      inboxUrl: 'https://lore.barebox.org/barebox/',
    }

    expect(getPublicInboxPage(value, inboxHtml)).toEqual(expected)
  })

  it('should return the inbox of a list page without a trailing slash', () => {
    const value = 'https://lore.barebox.org/barebox'
    const expected: PublicInboxPage = {
      kind: 'inbox',
      inboxUrl: 'https://lore.barebox.org/barebox/',
    }

    expect(getPublicInboxPage(value, inboxHtml)).toEqual(expected)
  })

  it('should return the inbox of a list page with a search query', () => {
    const value = 'https://lore.barebox.org/barebox/?q=ubootvarfs'
    const expected: PublicInboxPage = {
      kind: 'inbox',
      inboxUrl: 'https://lore.barebox.org/barebox/',
    }

    expect(getPublicInboxPage(value, inboxHtml)).toEqual(expected)
  })

  it('should return the inbox mounted at the root of a host', () => {
    const value = 'https://list.orgmode.org/'
    const expected: PublicInboxPage = {
      kind: 'inbox',
      inboxUrl: 'https://list.orgmode.org/',
    }

    expect(getPublicInboxPage(value, inboxHtml)).toEqual(expected)
  })

  it('should return the inbox under a sub-path', () => {
    const value = 'https://mirror.b10c.me/lists/bitcoindev/'
    const expected: PublicInboxPage = {
      kind: 'inbox',
      inboxUrl: 'https://mirror.b10c.me/lists/bitcoindev/',
    }

    expect(getPublicInboxPage(value, inboxHtml)).toEqual(expected)
  })

  it('should return the message of a message page', () => {
    const value =
      'https://public-inbox.gentoo.org/gentoo-dev/20261003070146.686610-1-mgorny@gentoo.org/'
    const expected: PublicInboxPage = {
      kind: 'message',
      inboxUrl: 'https://public-inbox.gentoo.org/gentoo-dev/',
      messageId: '20261003070146.686610-1-mgorny@gentoo.org',
    }

    expect(getPublicInboxPage(value, messageHtml)).toEqual(expected)
  })

  it('should return the message of a thread page', () => {
    const value =
      'https://public-inbox.gentoo.org/gentoo-dev/20261003070146.686610-1-mgorny@gentoo.org/T/'
    const expected: PublicInboxPage = {
      kind: 'message',
      inboxUrl: 'https://public-inbox.gentoo.org/gentoo-dev/',
      messageId: '20261003070146.686610-1-mgorny@gentoo.org',
    }

    expect(getPublicInboxPage(value, threadHtml)).toEqual(expected)
  })

  it('should return the message of a page with links without a trailing slash', () => {
    const value =
      'https://lore.altlinux.org/sisyphus-incominger/girar.task.435315.1.1@gyle.mskdc.altlinux.org/'
    const expected: PublicInboxPage = {
      kind: 'message',
      inboxUrl: 'https://lore.altlinux.org/sisyphus-incominger/',
      messageId: 'girar.task.435315.1.1@gyle.mskdc.altlinux.org',
    }

    expect(getPublicInboxPage(value, messageWithoutSlashHtml)).toEqual(expected)
  })

  it('should return the message of an inbox mounted at the root of a host', () => {
    const value = 'https://list.orgmode.org/87bj9ct0ci.fsf@icloud.com/'
    const expected: PublicInboxPage = {
      kind: 'message',
      inboxUrl: 'https://list.orgmode.org/',
      messageId: '87bj9ct0ci.fsf@icloud.com',
    }

    expect(getPublicInboxPage(value, messageHtml)).toEqual(expected)
  })

  it('should keep a percent-encoded message id as it is', () => {
    const value =
      'https://inbox.kyleam.com/snakemake-mode/kyleam%2Fsnakemake-mode%2Fissues%2F11%2F211507107@github.com/'
    const expected: PublicInboxPage = {
      kind: 'message',
      inboxUrl: 'https://inbox.kyleam.com/snakemake-mode/',
      messageId: 'kyleam%2Fsnakemake-mode%2Fissues%2F11%2F211507107@github.com',
    }

    expect(getPublicInboxPage(value, messageHtml)).toEqual(expected)
  })

  it('should return the inbox of a walled lore.kernel.org list page', () => {
    const value = 'https://lore.kernel.org/linux-pci/'
    const expected: PublicInboxPage = {
      kind: 'inbox',
      inboxUrl: 'https://lore.kernel.org/linux-pci/',
    }

    expect(getPublicInboxPage(value, anubisHtml)).toEqual(expected)
  })

  it('should return the message of a walled lore.kernel.org message page', () => {
    const value = 'https://lore.kernel.org/all/20200511194017.313c2881@xps13/T/'
    const expected: PublicInboxPage = {
      kind: 'message',
      inboxUrl: 'https://lore.kernel.org/all/',
      messageId: '20200511194017.313c2881@xps13',
    }

    expect(getPublicInboxPage(value, anubisHtml)).toEqual(expected)
  })

  it('should return the inbox of a lore.kernel.org list page without content', () => {
    const value = 'https://lore.kernel.org/linux-pci/'
    const expected: PublicInboxPage = {
      kind: 'inbox',
      inboxUrl: 'https://lore.kernel.org/linux-pci/',
    }

    expect(getPublicInboxPage(value)).toEqual(expected)
  })

  it('should return the inbox of a lore.kernel.org page below the inbox root', () => {
    const value = 'https://lore.kernel.org/linux-pci/_/text/help/'
    const expected: PublicInboxPage = {
      kind: 'inbox',
      inboxUrl: 'https://lore.kernel.org/linux-pci/',
    }

    expect(getPublicInboxPage(value)).toEqual(expected)
  })

  it('should return undefined for the lore.kernel.org inbox listing', () => {
    expect(getPublicInboxPage('https://lore.kernel.org/', anubisHtml)).toBeUndefined()
  })

  it('should return undefined for a page with more levels than its URL', () => {
    expect(getPublicInboxPage('https://list.orgmode.org/', threadHtml)).toBeUndefined()
  })

  it('should return undefined for other hosts without the links', () => {
    expect(getPublicInboxPage('https://example.com/barebox/', anubisHtml)).toBeUndefined()
  })

  it('should return undefined for an unparsable URL', () => {
    expect(getPublicInboxPage('not-a-url', inboxHtml)).toBeUndefined()
  })
})

describe('publicInboxHandler', () => {
  describe('match', () => {
    it('should match a public-inbox page', () => {
      expect(publicInboxHandler.match('https://lore.barebox.org/barebox/', inboxHtml)).toBe(true)
    })

    it('should match a walled lore.kernel.org page', () => {
      expect(publicInboxHandler.match('https://lore.kernel.org/linux-pci/', anubisHtml)).toBe(true)
    })

    it('should not match a page without the links on another host', () => {
      expect(publicInboxHandler.match('https://example.com/barebox/', anubisHtml)).toBe(false)
    })

    it('should not match the lore.kernel.org inbox listing', () => {
      expect(publicInboxHandler.match('https://lore.kernel.org/', anubisHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the inbox feed for a list page', () => {
      const value = 'https://lore.barebox.org/barebox/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lore.barebox.org/barebox/new.atom',
          hint: { key: 'public-inbox:messages', label: 'Messages' },
        },
      ]

      expect(publicInboxHandler.resolve(value, inboxHtml)).toEqual(expected)
    })

    it('should return the thread and inbox feeds for a message page', () => {
      const value = 'https://lore.kernel.org/all/20200511194017.313c2881@xps13/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://lore.kernel.org/all/20200511194017.313c2881@xps13/t.atom',
          hint: { key: 'public-inbox:thread', label: 'Thread' },
        },
        {
          uri: 'https://lore.kernel.org/all/new.atom',
          hint: { key: 'public-inbox:messages', label: 'Messages' },
        },
      ]

      expect(publicInboxHandler.resolve(value, anubisHtml)).toEqual(expected)
    })

    it('should return empty array for a page that does not parse', () => {
      expect(publicInboxHandler.resolve('https://example.com/', anubisHtml)).toEqual([])
    })
  })
})
