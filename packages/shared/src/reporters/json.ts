import type { AnalyzeReport, Reporter, ReporterOptions } from './types'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'pathe'

export const JsonReporter: Reporter = {
  report: async (data: AnalyzeReport, options?: ReporterOptions) => {
    const output = JSON.stringify(data, null, 2)

    if (options?.output) {
      const path = resolve(process.cwd(), options.output)
      await writeFile(path, output, 'utf8')
      console.log(`Report written to ${path}`)
    } else {
      console.log(output)
    }
  },
}
