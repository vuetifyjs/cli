export type FeatureType = 'component' | 'composable' | 'constant' | 'plugin' | 'util' | 'type'

export interface AnalyzedFeature {
  name: string
  type: FeatureType
}

export interface AnalyzeReport {
  meta: {
    packageName: string
    version: string
  }
  features: AnalyzedFeature[]
}

export interface ReporterOptions {
  output?: string
}

export interface Reporter {
  report: (data: AnalyzeReport, options?: ReporterOptions) => Promise<void> | void
}
