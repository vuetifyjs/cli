import type { AnalyzeReport, Reporter } from './types'
import { ansi256, bold, dim, green, red, yellow } from 'kolorist'

const blue = ansi256(33)

export const ConsoleReporter: Reporter = {
  report: (reports: AnalyzeReport[]) => {
    console.log()
    console.log(bold('Vuetify Analysis Report'))
    console.log(blue('======================='))
    console.log()

    // Collect all parse errors across reports (they're duplicated since they apply to all packages)
    const allParseErrors = reports[0]?.parseErrors ?? []

    for (const data of reports) {
      console.log(`Package: ${green(data.meta.packageName)}`)
      console.log(`Version: ${green(data.meta.version)}`)
      console.log()

      if (data.features.length === 0) {
        console.log(yellow('No features detected.'))
        console.log()
        continue
      }

      console.log(`Detected ${green(data.features.length)} features:`)
      console.log()

      const grouped = data.features.reduce((acc, feature) => {
        if (!acc[feature.type]) {
          acc[feature.type] = []
        }
        acc[feature.type].push(feature)
        return acc
      }, {} as Record<string, typeof data.features>)

      const categories = ['component', 'composable', 'constant', 'plugin', 'util', 'type'] as const

      for (const category of categories) {
        const features = grouped[category]
        if (features && features.length > 0) {
          console.log(bold(category.charAt(0).toUpperCase() + category.slice(1) + 's'))
          for (const feature of features) {
            console.log(`  ${blue('•')} ${feature.name}`)
          }
          console.log()
        }
      }
      if (reports.indexOf(data) !== reports.length - 1) {
        console.log(blue('-----------------------'))
      }
      console.log()
    }

    // Generate docs URL with all documentable features
    const documentableTypes = new Set(['component', 'composable', 'plugin', 'util'])
    const allFeatures = reports
      .flatMap(r => r.features)
      .filter(f => documentableTypes.has(f.type))
      .map(f => f.name)

    if (allFeatures.length > 0) {
      const url = `https://0.vuetifyjs.com/?features=${allFeatures.join(',')}`
      console.log(bold('Documentation'))
      console.log(`  ${blue('→')} ${url}`)
      console.log()
    }

    // Report parse errors if any files were skipped
    if (allParseErrors.length > 0) {
      console.log(yellow(bold('Warnings')))
      console.log(yellow(`${allParseErrors.length} file(s) could not be parsed and were skipped:`))
      console.log()
      for (const parseError of allParseErrors.slice(0, 10)) {
        console.log(`  ${red('✗')} ${parseError.file}`)
        console.log(`    ${dim(parseError.error.split('\n')[0])}`)
      }
      if (allParseErrors.length > 10) {
        console.log(`  ${dim(`... and ${allParseErrors.length - 10} more`)}`)
      }
      console.log()
      console.log(dim('  These files may contain syntax errors or unsupported syntax.'))
      console.log(dim('  Set DEBUG=1 for detailed error messages.'))
      console.log()
    }
  },
}
