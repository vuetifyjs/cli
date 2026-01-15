/**
 * Structured error types for better DX.
 * Each error includes an actionable message to help developers resolve issues.
 */

export class VuetifyCliError extends Error {
  constructor (
    message: string,
    public readonly code: string,
    public readonly suggestion?: string,
  ) {
    super(message)
    this.name = 'VuetifyCliError'
  }

  toString (): string {
    let result = `${this.message}`
    if (this.suggestion) {
      result += `\n  Suggestion: ${this.suggestion}`
    }
    return result
  }
}

export class TemplateDownloadError extends VuetifyCliError {
  constructor (templateName: string, cause?: Error) {
    const isNetworkError = cause?.message?.includes('fetch') || cause?.message?.includes('ENOTFOUND')
    const suggestion = isNetworkError
      ? 'Check your network connection and try again.'
      : 'Verify the template exists at gh:vuetifyjs/templates and try again.'

    super(
      `Failed to download template "${templateName}"${cause ? `: ${cause.message}` : ''}`,
      'TEMPLATE_DOWNLOAD_FAILED',
      suggestion,
    )
    this.name = 'TemplateDownloadError'
    if (cause) {
      this.cause = cause
    }
  }
}

export class TemplateCopyError extends VuetifyCliError {
  constructor (templatePath: string, cause?: Error) {
    const isPermissionError = cause?.message?.includes('EACCES') || cause?.message?.includes('EPERM')
    const suggestion = isPermissionError
      ? 'Check that you have read permissions for the template directory.'
      : 'Verify the template path exists and is accessible.'

    super(
      `Failed to copy template from "${templatePath}"${cause ? `: ${cause.message}` : ''}`,
      'TEMPLATE_COPY_FAILED',
      suggestion,
    )
    this.name = 'TemplateCopyError'
    if (cause) {
      this.cause = cause
    }
  }
}

export class ProjectExistsError extends VuetifyCliError {
  constructor (projectPath: string) {
    super(
      `Directory "${projectPath}" already exists`,
      'PROJECT_EXISTS',
      'Use --force to overwrite the existing directory, or choose a different project name.',
    )
    this.name = 'ProjectExistsError'
  }
}

export class DependencyInstallError extends VuetifyCliError {
  constructor (packageManager: string, cause?: Error) {
    super(
      `Failed to install dependencies with ${packageManager}${cause ? `: ${cause.message}` : ''}`,
      'DEPENDENCY_INSTALL_FAILED',
      `Try running "${packageManager} install" manually in the project directory.`,
    )
    this.name = 'DependencyInstallError'
    if (cause) {
      this.cause = cause
    }
  }
}

export class FeatureApplyError extends VuetifyCliError {
  constructor (featureName: string, cause?: Error) {
    super(
      `Failed to apply feature "${featureName}"${cause ? `: ${cause.message}` : ''}`,
      'FEATURE_APPLY_FAILED',
      'Try creating the project without this feature and adding it manually.',
    )
    this.name = 'FeatureApplyError'
    if (cause) {
      this.cause = cause
    }
  }
}

export class FileParseError extends VuetifyCliError {
  constructor (
    public readonly filePath: string,
    cause?: Error,
  ) {
    const isSyntaxError = cause?.message?.includes('Unexpected token') || cause?.message?.includes('SyntaxError')
    const suggestion = isSyntaxError
      ? 'The file may contain syntax errors. Fix them and try again.'
      : 'The file could not be parsed. It may use unsupported syntax.'

    super(
      `Failed to parse "${filePath}"${cause ? `: ${cause.message}` : ''}`,
      'FILE_PARSE_FAILED',
      suggestion,
    )
    this.name = 'FileParseError'
    if (cause) {
      this.cause = cause
    }
  }
}

export class DirectoryNotFoundError extends VuetifyCliError {
  constructor (dirPath: string) {
    super(
      `Directory "${dirPath}" does not exist`,
      'DIRECTORY_NOT_FOUND',
      'Verify the path is correct and the directory exists.',
    )
    this.name = 'DirectoryNotFoundError'
  }
}

/**
 * Format an error for display in the console.
 * Handles both VuetifyCliError and standard Error types.
 */
export function formatError (error: unknown): string {
  if (error instanceof VuetifyCliError) {
    return error.toString()
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
