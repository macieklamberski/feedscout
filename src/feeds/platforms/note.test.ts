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

  it('should return the home page for the root', () => {
    const expected: NoteUrl = { kind: 'home' }

    expect(parseNoteUrl('https://note.com/')).toEqual(expected)
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
  })
})
