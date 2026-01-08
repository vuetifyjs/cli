import { parseExpression } from 'magicast'

/**
 * Adds a statement to a function body using AST manipulation.
 * magicast's $body.push() doesn't work for function-expression types,
 * so we need to manipulate the AST directly.
 */
export function addStatementToFunctionBody (fn: any, statement: string) {
  if (!fn || !fn.$ast?.body?.body) return false

  const expr = parseExpression(statement)
  const newStatement = {
    type: 'ExpressionStatement',
    expression: expr.$ast,
    loc: null,
  }

  fn.$ast.body.body.push(newStatement)
  return true
}

/**
 * Checks if the export is a function (either 'function' or 'function-expression')
 */
export function isFunction (fn: any): boolean {
  return fn && (fn.$type === 'function' || fn.$type === 'function-expression')
}
