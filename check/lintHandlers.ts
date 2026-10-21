// Runs the line checks in `lint.ts` over the platform handlers. Run from the repo root with
// `bun run lint:handlers`.
import * as utils from '../src/common/utils.js'
import { lintDuplicates, lintSource, type SharedRegex } from './lint.js'

const root = `${import.meta.dir}/..`
const shared: Array<SharedRegex> = []
const sources: Record<string, string> = {}

for (const [name, value] of Object.entries(utils)) {
  if (value instanceof RegExp) {
    shared.push({ name, source: value.source })
  }
}

for (const directory of ['src/feeds/platforms', 'src/favicons/platforms']) {
  for await (const path of new Bun.Glob('*.ts').scan(`${root}/${directory}`)) {
    if (path.endsWith('.test.ts') || path === 'invariant.ts') {
      continue
    }

    sources[`${directory}/${path}`] = await Bun.file(`${root}/${directory}/${path}`).text()
  }
}

const findings = [
  ...Object.entries(sources).flatMap(([file, source]) => lintSource(file, source, shared)),
  ...lintDuplicates(sources, shared),
]

for (const finding of findings) {
  console.error(`${finding.check}\t${finding.file}:${finding.line}\t${finding.text}`)
}

if (findings.length > 0) {
  process.exit(1)
}
