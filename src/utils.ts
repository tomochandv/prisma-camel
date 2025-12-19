/**
 * snake_case 문자열을 camelCase로 변환
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * 문자열이 snake_case인지 확인
 */
export function isSnakeCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(str)
}
