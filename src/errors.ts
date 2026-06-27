export const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred.'

export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message
  if (typeof error === 'string' && error.length > 0) return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return DEFAULT_ERROR_MESSAGE
}

export function getErrorType(error: unknown): string {
  if (error === null) return 'null'
  if (Array.isArray(error)) return 'array'
  return typeof error
}
