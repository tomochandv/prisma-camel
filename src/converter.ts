import { toCamelCase, isSnakeCase } from './utils'

/**
 * @map() 안의 내용은 제외하고 나머지 부분의 snake_case를 camelCase로 변환
 */
function convertRestExcludingMapContent(rest: string): string {
  // @map("...") 부분을 찾아서 보호
  const mapRegex = /@map\s*\(\s*"[^"]*"\s*\)/g
  const mapMatches: string[] = []
  let result = rest.replace(mapRegex, match => {
    mapMatches.push(match)
    return `__MAP_PLACEHOLDER_${mapMatches.length - 1}__`
  })

  // @map() 밖의 snake_case를 camelCase로 변환
  result = result.replace(/\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g, match => {
    if (isSnakeCase(match)) {
      return toCamelCase(match)
    }
    return match
  })

  // @map() 부분 복원
  mapMatches.forEach((mapContent, index) => {
    result = result.replace(`__MAP_PLACEHOLDER_${index}__`, mapContent)
  })

  return result
}

/**
 * Prisma 스키마 파일의 snake_case를 camelCase로 변환
 */
export function convertPrismaSchema(schema: string): string {
  const lines = schema.split('\n')
  const convertedLines: string[] = []
  let currentBlock: 'model' | 'enum' | 'type' | 'generator' | 'datasource' | null = null

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const trimmed = line.trim()

    // 블록 시작 감지
    if (trimmed.startsWith('model ')) {
      currentBlock = 'model'
    } else if (trimmed.startsWith('enum ')) {
      currentBlock = 'enum'
    } else if (trimmed.startsWith('type ')) {
      currentBlock = 'type'
    } else if (trimmed.startsWith('generator ')) {
      currentBlock = 'generator'
    } else if (trimmed.startsWith('datasource ')) {
      currentBlock = 'datasource'
    }

    // 블록 종료 감지
    if (trimmed === '}') {
      currentBlock = null
    }

    // 모델 이름 변환 (model user_profile -> model userProfile)
    if (trimmed.startsWith('model ')) {
      const modelMatch = line.match(/^(\s*model\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s*{?)$/)
      if (modelMatch) {
        const [, prefix, modelName, suffix] = modelMatch
        if (isSnakeCase(modelName)) {
          convertedLines.push(`${prefix}${toCamelCase(modelName)}${suffix}`)
          continue
        }
      }
    }

    // enum 이름 변환
    if (trimmed.startsWith('enum ')) {
      const enumMatch = line.match(/^(\s*enum\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s*{?)$/)
      if (enumMatch) {
        const [, prefix, enumName, suffix] = enumMatch
        if (isSnakeCase(enumName)) {
          convertedLines.push(`${prefix}${toCamelCase(enumName)}${suffix}`)
          continue
        }
      }
    }

    // type 이름 변환
    if (trimmed.startsWith('type ')) {
      const typeMatch = line.match(/^(\s*type\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s*{?)$/)
      if (typeMatch) {
        const [, prefix, typeName, suffix] = typeMatch
        if (isSnakeCase(typeName)) {
          convertedLines.push(`${prefix}${toCamelCase(typeName)}${suffix}`)
          continue
        }
      }
    }

    // 필드 이름 변환 (model, type 블록 내에서만)
    const fieldMatch = line.match(/^(\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s+.*)$/)
    if (fieldMatch && (currentBlock === 'model' || currentBlock === 'type')) {
      const [, indent, fieldName, rest] = fieldMatch

      // @relation이 있는지 확인 (관계 필드는 @map 추가 안함)
      const isRelationField = rest.includes('@relation')

      if (isSnakeCase(fieldName)) {
        // @map 속성이 이미 있는지 확인
        if (!rest.includes('@map(')) {
          // @map() 밖의 타입 참조만 변환
          const convertedRest = convertRestExcludingMapContent(rest)

          // 관계 필드가 아닌 경우에만 @map 추가
          if (!isRelationField) {
            // @map 추가하여 원래 이름 유지
            const hasComment = convertedRest.includes('//')
            const restWithoutComment = hasComment ? convertedRest.substring(0, convertedRest.indexOf('//')) : convertedRest
            const comment = hasComment ? ' ' + convertedRest.substring(convertedRest.indexOf('//')).trim() : ''

            line = `${indent}${toCamelCase(fieldName)}${restWithoutComment.trimEnd()} @map("${fieldName}")${comment}`
          } else {
            // 관계 필드는 필드명만 변환
            line = `${indent}${toCamelCase(fieldName)}${convertedRest}`
          }
          convertedLines.push(line)
          continue
        } else {
          // 이미 @map이 있으면 필드 이름만 camelCase로 변환, @map() 안은 그대로 유지
          const convertedRest = convertRestExcludingMapContent(rest)
          line = `${indent}${toCamelCase(fieldName)}${convertedRest}`
          convertedLines.push(line)
          continue
        }
      } else if (currentBlock === 'model') {
        // 필드 이름은 camelCase지만 타입 참조는 변환 (@map 안 제외)
        line = `${indent}${fieldName}${convertRestExcludingMapContent(rest)}`
      }
    }

    convertedLines.push(line)
  }

  return convertedLines.join('\n')
}
