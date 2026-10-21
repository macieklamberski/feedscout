import { describe, expect, it } from 'bun:test'
import { lintDuplicates, lintSource } from './lint.js'

const file = 'src/feeds/platforms/acme.ts'

describe('lintSource', () => {
  it('should flag a length in a regex and on a value', () => {
    const value = [
      'const userRegex = /^\\/([a-zA-Z0-9_-]{3,})\\/?$/i',
      '  if (first.length < 2) {',
      '  if (segments.length === 3) {',
    ].join('\n')
    const expected = [1, 2]

    expect(lintSource(file, value, []).map((finding) => finding.line)).toEqual(expected)
  })

  it('should pass a date route', () => {
    const value = 'const dayRegex = /^\\/(\\d{4})\\/(\\d{2})\\/(\\d{2})\\/?$/'

    expect(lintSource(file, value, [])).toEqual([])
  })

  it('should pass a length under its marker', () => {
    const value = [
      '// length: keeps two-letter country pages out',
      '// Dailymotion serves a country page on every two-letter first segment.',
      'const userRegex = /^\\/([a-zA-Z0-9_-]{3,})\\/?$/i',
    ].join('\n')

    expect(lintSource(file, value, [])).toEqual([])
  })

  it('should pass a length under an extraction marker', () => {
    const value = [
      '// length: extracts the key from the slug',
      'const shortIdRegex = /-([^/]{11})$/',
    ].join('\n')

    expect(lintSource(file, value, [])).toEqual([])
  })

  it('should read the marker only for the line below its block', () => {
    const value = [
      '// length: keeps two-letter country pages out',
      'const userRegex = /^\\/([a-z]{3,})$/i',
      'const photoIdRegex = /^\\d{14}$/',
    ].join('\n')
    const expected = [3]

    expect(lintSource(file, value, []).map((finding) => finding.line)).toEqual(expected)
  })

  it('should flag a hand-written list of format extensions', () => {
    const value = [
      'const suffixRegex = /\\.(?:atom|gpg|keys|png)$/i',
      "const suffixes = ['.rss', '.xml']",
    ].join('\n')
    const expected = ['extension-list', 'extension-list']

    expect(lintSource(file, value, []).map((finding) => finding.check)).toEqual(expected)
  })

  it('should pass a list of the platform suffixes under its marker', () => {
    const value = [
      "// suffixes: Gitea's own user routes, on a name that can hold a dot",
      'const userRouteSuffixRegex = /\\.(?:atom|gpg|keys|png|rss)$/i',
    ].join('\n')

    expect(lintSource(file, value, [])).toEqual([])
  })

  it('should read a marker for a declaration wrapped after its equals sign', () => {
    const value = [
      "// suffixes: WordPress's own root scripts and sitemaps",
      'const reservedPathRegex =',
      '  /^\\/(?:wp-admin|[^/]*\\.(?:php|xml))(?:\\/|$)/i',
      'const suffixRegex = /\\.(?:atom|rss)$/i',
    ].join('\n')
    const expected = [4]

    expect(lintSource(file, value, []).map((finding) => finding.line)).toEqual(expected)
  })

  it('should pass an alternation of top-level domains after a host label', () => {
    const value = 'const hostRegex = /^[^.]+\\.blogspot\\.(?:com|de)$/'

    expect(lintSource(file, value, [])).toEqual([])
  })

  it('should flag a local alias of a shared regex', () => {
    const value = 'const usernameRegex = wordOrHyphenRegex'
    const expected = ['regex-alias']

    expect(lintSource(file, value, []).map((finding) => finding.check)).toEqual(expected)
  })

  it('should flag a literal that spells a shared regex', () => {
    const value = 'const idRegex = /^\\d+$/'
    const shared = [{ name: 'digitsRegex', source: '^\\d+$' }]
    const expected = ['const idRegex = /^\\d+$/ copies digitsRegex']

    expect(lintSource(file, value, shared).map((finding) => finding.text)).toEqual(expected)
  })

  it('should skip prose in comments', () => {
    const value = '// A name of {3,} characters, as in .(?:rss|atom).'

    expect(lintSource(file, value, [])).toEqual([])
  })
})

describe('lintDuplicates', () => {
  it('should flag an anchored value pattern written in two handlers', () => {
    const value = {
      'src/feeds/platforms/acme.ts': 'const idRegex = /^[a-z0-9_]+$/i',
      'src/favicons/platforms/beta.ts': 'const slugRegex = /^[a-z0-9_]+$/i',
      'src/feeds/platforms/gamma.ts': 'const pathRegex = /^\\/v\\/(\\d+)$/',
    }
    const expected = ['src/feeds/platforms/acme.ts', 'src/favicons/platforms/beta.ts']

    expect(lintDuplicates(value, []).map((finding) => finding.file)).toEqual(expected)
  })

  it('should pass a copy of a shared regex, which lintSource reports', () => {
    const value = {
      'src/feeds/platforms/acme.ts': 'const idRegex = /^\\d+$/',
      'src/feeds/platforms/beta.ts': 'const postIdRegex = /^\\d+$/',
    }
    const shared = [{ name: 'digitsRegex', source: '^\\d+$' }]

    expect(lintDuplicates(value, shared)).toEqual([])
  })
})
