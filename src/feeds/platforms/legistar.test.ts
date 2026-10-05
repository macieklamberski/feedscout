import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type LegistarUrl, legistarHandler, parseLegistarUrl } from './legistar.js'

describe('parseLegistarUrl', () => {
  it('should return the legislation for a legislation detail page', () => {
    const value =
      'https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
    const expected: LegistarUrl = {
      kind: 'legislation',
      id: '1065902',
      guid: 'EFE087C2-C62A-40F9-B1F9-6E2975E86217',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should return the meeting for a meeting detail page', () => {
    const value =
      'https://a2gov.legistar.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804&Options=info|&Search='
    const expected: LegistarUrl = {
      kind: 'meeting',
      id: '1373416',
      guid: '351F7891-35DC-4AE5-BCED-DA4B7A00E804',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should ignore the case of the page name', () => {
    const value =
      'https://madison.legistar.com/legislationdetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
    const expected: LegistarUrl = {
      kind: 'legislation',
      id: '1065902',
      guid: 'EFE087C2-C62A-40F9-B1F9-6E2975E86217',
    }

    expect(parseLegistarUrl(value)).toEqual(expected)
  })

  it('should return undefined for a detail page without a GUID', () => {
    expect(
      parseLegistarUrl('https://madison.legistar.com/LegislationDetail.aspx?ID=1065902'),
    ).toBeUndefined()
  })

  it('should return undefined for a non-numeric ID', () => {
    expect(
      parseLegistarUrl(
        'https://madison.legistar.com/LegislationDetail.aspx?ID=abc&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
      ),
    ).toBeUndefined()
  })

  it('should return undefined for a malformed GUID', () => {
    expect(
      parseLegistarUrl('https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=abc'),
    ).toBeUndefined()
  })

  it('should return undefined for another page', () => {
    expect(parseLegistarUrl('https://madison.legistar.com/Calendar.aspx')).toBeUndefined()
  })

  it('should return undefined for another detail page', () => {
    expect(
      parseLegistarUrl(
        'https://madison.legistar.com/DepartmentDetail.aspx?ID=17411&GUID=ED5B7181-AD76-4EF5-9730-729ACA9BFE9C',
      ),
    ).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(
      parseLegistarUrl(
        'https://example.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
      ),
    ).toBeUndefined()
  })
})

describe('legistarHandler', () => {
  describe('match', () => {
    it('should match a Legistar detail page', () => {
      const value =
        'https://nashville.legistar.com/LegislationDetail.aspx?ID=6706761&GUID=053E478F-E646-4638-A793-24217381CB5E'

      expect(legistarHandler.match(value)).toBe(true)
    })

    it('should not match another page', () => {
      expect(legistarHandler.match('https://madison.legistar.com/Calendar.aspx')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the legislation feed', () => {
      const value =
        'https://madison.legistar.com/LegislationDetail.aspx?ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://madison.legistar.com/Feed.ashx?M=LD&ID=1065902&GUID=EFE087C2-C62A-40F9-B1F9-6E2975E86217',
          hint: { key: 'legistar:legislation', label: 'Legislation' },
        },
      ]

      expect(legistarHandler.resolve(value)).toEqual(expected)
    })

    it('should return the meeting feed', () => {
      const value =
        'https://a2gov.legistar.com/MeetingDetail.aspx?ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://a2gov.legistar.com/Feed.ashx?M=CalendarDetail&ID=1373416&GUID=351F7891-35DC-4AE5-BCED-DA4B7A00E804',
          hint: { key: 'legistar:meeting', label: 'Meeting' },
        },
      ]

      expect(legistarHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for a URL outside Legistar', () => {
      expect(legistarHandler.resolve('https://example.com/')).toEqual([])
    })
  })
})
