import type { AnalyzeReport, Reporter } from './types'
import { ansi256, bold, green, yellow } from 'kolorist'

const blue = ansi256(33)

export const ConsoleReporter: Reporter = {
  report: (reports: AnalyzeReport[]) => {
    console.log()
    console.log(bold('Vuetify Analysis Report'))
    console.log(blue('======================='))
    console.log()

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
  },
}
