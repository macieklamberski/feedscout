import { describe, expect, it } from 'bun:test'
import type { NoteUrl } from './note.js'
import { noteHandler, parseNoteUrl } from './note.js'

describe('parseNoteUrl', () => {
  it('should return the user for a profile page', () => {
    const expected: NoteUrl = { kind: 'user', username: 'tsukasa_yamato' }

    expect(parseNoteUrl('https://note.com/tsukasa_yamato')).toEqual(expected)
  })

  it('should return the user for an article page', () => {
    const expected: NoteUrl = { kind: 'user', username: 'tsukasa_yamato' }

    expect(parseNoteUrl('https://note.com/tsukasa_yamato/n/some-note')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: NoteUrl = { kind: 'user', username: 'alice' }

    expect(parseNoteUrl('https://www.note.com/alice')).toEqual(expected)
  })

  it('should return the magazine for a magazine page', () => {
    const expected: NoteUrl = { kind: 'magazine', username: 'notemag', magazine: 'm7244518f06ae' }

    expect(parseNoteUrl('https://note.com/notemag/m/m7244518f06ae')).toEqual(expected)
  })

  it('should return the magazine for a magazine page with a capitalized m segment', () => {
    const expected: NoteUrl = { kind: 'magazine', username: 'notemag', magazine: 'm7244518f06ae' }

    expect(parseNoteUrl('https://note.com/notemag/M/m7244518f06ae')).toEqual(expected)
  })

  it('should return the magazine for a magazine under a reserved path', () => {
    const expected: NoteUrl = { kind: 'magazine', username: 'search', magazine: 'm7244518f06ae' }

    expect(parseNoteUrl('https://note.com/search/m/m7244518f06ae')).toEqual(expected)
  })

  it('should return the tag for a hashtag page', () => {
    const expected: NoteUrl = { kind: 'hashtag', tag: 'AI' }

    expect(parseNoteUrl('https://note.com/hashtag/AI')).toEqual(expected)
  })

  it('should return the tag for a hashtag page with a capitalized hashtag segment', () => {
    const expected: NoteUrl = { kind: 'hashtag', tag: 'AI' }

    expect(parseNoteUrl('https://note.com/Hashtag/AI')).toEqual(expected)
  })

  it('should return the tag for the tag page a hashtag redirects to', () => {
    const expected: NoteUrl = { kind: 'hashtag', tag: 'AI' }

    expect(parseNoteUrl('https://note.com/tag/AI')).toEqual(expected)
  })

  it('should return undefined for excluded paths', () => {
    expect(parseNoteUrl('https://note.com/login')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/about')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/api')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/explore')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/hashtag')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/help')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/m')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/n')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/premium')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/privacy')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/ranking')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/search')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/settings')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/signup')).toBeUndefined()
    expect(parseNoteUrl('https://note.com/terms')).toBeUndefined()
  })

  it('should return undefined for a capitalized excluded path', () => {
    expect(parseNoteUrl('https://note.com/Login')).toBeUndefined()
  })

  it('should return undefined for the root', () => {
    expect(parseNoteUrl('https://note.com/')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseNoteUrl('https://example.com/alice')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseNoteUrl('not-a-url')).toBeUndefined()
  })
})

describe('noteHandler', () => {
  describe('match', () => {
    it('should match a note.com URL', () => {
      expect(noteHandler.match('https://note.com')).toBe(true)
    })

    it('should not match another host', () => {
      expect(noteHandler.match('https://example.com')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return feed URL for blog', () => {
      const value = 'https://note.com/tsukasa_yamato'
      const expected = [
        {
          uri: 'https://note.com/tsukasa_yamato/rss',
          hint: { key: 'note:blog', label: 'Blog' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for hashtag page', () => {
      const value = 'https://note.com/hashtag/AI'
      const expected = [
        {
          uri: 'https://note.com/hashtag/AI/rss',
          hint: { key: 'note:hashtag', label: 'Hashtag' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return feed URL for magazine page', () => {
      const value = 'https://note.com/notemag/m/m7244518f06ae'
      const expected = [
        {
          uri: 'https://note.com/notemag/m/m7244518f06ae/rss',
          hint: { key: 'note:magazine', label: 'Magazine' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return featured feed for root path', () => {
      const value = 'https://note.com/'
      const expected = [
        {
          uri: 'https://note.com/rss',
          hint: { key: 'note:featured', label: 'Featured' },
        },
      ]

      expect(noteHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for excluded paths', () => {
      expect(noteHandler.resolve('https://note.com/login')).toEqual([])
    })
  })
})
