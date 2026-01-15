export type FeatureType = 'component' | 'composable' | 'constant' | 'plugin' | 'util' | 'type'

export interface AnalyzedFeature {
  name: string
  type: FeatureType
}

export interface ParseError {
  file: string
  error: string
}

export interface AnalyzeReport {
  meta: {
    packageName: string
    version: string
  }
  features: AnalyzedFeature[]
  parseErrors?: ParseError[]
}

export interface ReporterOptions {
  output?: string
}

export interface Reporter {
  report: (data: AnalyzeReport[], options?: ReporterOptions) => Promise<void> | void
}
