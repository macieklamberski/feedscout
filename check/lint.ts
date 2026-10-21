// Line checks for the handler rules a single line can show, read by `lintHandlers.ts`: kept
// lengths, format extensions and shared regexes.
export type LintFinding = {
  check: string
  file: string
  line: number
  text: string
}

export type SharedRegex = {
  name: string
  source: string
}

const commentLineRegex = /^\s*\/\//
const regexAliasRegex = /^\s*(?:export )?const \w+ = [a-z]\w*Regex$/
// A `\.(?:rss|atom)` alternation after anything but a host label, which `\.(?:com|net)` is.
const extensionListRegex = /(?<![a-z0-9])\\\.\((?:\?:)?(?:[a-z0-9]+\|)+[a-z0-9]+\)/i
const dottedListRegex = /'\.[a-z0-9]+'(?:, '\.[a-z0-9]+')+/i
const regexLiteralsRegex =
  /(?<![\w)\]])\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\[\n])+\/[dgimsuyv]*/g
const quantifierRegex = /\{\d+(?:,\d*)?\}/
// A year, month or day in a date route is route structure, not a value length.
const dateQuantifierRegex = /\\d\{[24]\}/g
const lengthCompareRegex = /\b(\w+)\??\.length\s*(?:[<>]=?|[!=]==)\s*(?:[2-9]|\d{2,}|\w+Length)\b/
// A plural, `rest` or `path` names an array of segments, whose length is a route shape.
const arrayNameRegex = /(?:s|rest|path)$/
const lengthMarkerRegex = /^\s*\/\/ length: (?:keeps .+ out|extracts .+)/
const suffixMarkerRegex = /^\s*\/\/ suffixes: .+'s own .+/
const anchoredLiteralRegex = /^\/\^.*\$\/[a-z]*$/

const stripTrailingComment = (line: string): string => {
  return line.split(' // ')[0]
}

const listRegexLiterals = (line: string): Array<string> => {
  return [...line.matchAll(regexLiteralsRegex)].map((match) => match[0])
}

const toBody = (literal: string): string => {
  return literal.slice(1, literal.lastIndexOf('/'))
}

const isLengthTest = (line: string): boolean => {
  const compared = lengthCompareRegex.exec(line)

  if (compared && !arrayNameRegex.test(compared[1])) {
    return true
  }

  return listRegexLiterals(line).some((literal) => {
    return quantifierRegex.test(literal.replace(dateQuantifierRegex, ''))
  })
}

// An allowed length names what it keeps out in a `// length: keeps {what} out` comment in the
// block above it. Every other length, a regex quantifier included, is a guard the rules drop. A
// list of the platform's own suffixes names them in `// suffixes:`.
export const lintSource = (
  file: string,
  source: string,
  shared: Array<SharedRegex>,
): Array<LintFinding> => {
  const findings: Array<LintFinding> = []
  let hasLengthMarker = false
  let hasSuffixMarker = false

  for (const [index, line] of source.split('\n').entries()) {
    if (commentLineRegex.test(line)) {
      if (lengthMarkerRegex.test(line)) {
        hasLengthMarker = true
      }

      if (suffixMarkerRegex.test(line)) {
        hasSuffixMarker = true
      }

      continue
    }

    const code = stripTrailingComment(line)
    const add = (check: string, text = line.trim()) => {
      findings.push({ check, file, line: index + 1, text })
    }

    if (!hasLengthMarker && isLengthTest(code)) {
      add('length-marker')
    }

    if (!hasSuffixMarker && (extensionListRegex.test(code) || dottedListRegex.test(code))) {
      add('extension-list')
    }

    if (regexAliasRegex.test(code)) {
      add('regex-alias')
    }

    for (const literal of listRegexLiterals(code)) {
      const original = shared.find((regex) => regex.source === toBody(literal))

      if (original) {
        add('shared-copy', `${line.trim()} copies ${original.name}`)
      }
    }

    // A declaration wrapped after its `=` keeps the marker for the value on the next line.
    if (!code.trimEnd().endsWith('=')) {
      hasLengthMarker = false
      hasSuffixMarker = false
    }
  }

  return findings
}

// An anchored value pattern written in two handlers belongs in `src/common/utils.ts`. A copy of
// a shared regex is left to `lintSource`, which reports it as a shared copy.
export const lintDuplicates = (
  sources: Record<string, string>,
  shared: Array<SharedRegex>,
): Array<LintFinding> => {
  const seen = new Map<string, Array<LintFinding>>()

  for (const [file, source] of Object.entries(sources)) {
    for (const [index, line] of source.split('\n').entries()) {
      if (commentLineRegex.test(line)) {
        continue
      }

      for (const literal of listRegexLiterals(stripTrailingComment(line))) {
        const isShared = shared.some((regex) => regex.source === toBody(literal))

        if (!anchoredLiteralRegex.test(literal) || literal.includes('\\/') || isShared) {
          continue
        }

        const finding = { check: 'duplicate-pattern', file, line: index + 1, text: literal }
        seen.set(literal, [...(seen.get(literal) ?? []), finding])
      }
    }
  }

  const repeated = [...seen.values()].filter((findings) => {
    return new Set(findings.map((finding) => finding.file)).size > 1
  })

  return repeated.flat()
}
