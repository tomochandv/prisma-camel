import { toCamelCase, toPascalCase, isSnakeCase } from './utils'

/**
 * @map() 안의 내용은 제외하고 나머지 부분의 snake_case를 camelCase로 변환
 * 타입 참조(첫 번째 단어)는 PascalCase로, 배열/속성 내부는 camelCase로 변환
 */
function convertRestExcludingMapContent(rest: string, isFirstWord = true): string {
  // @map("...") 부분을 찾아서 보호
  const mapRegex = /@map\s*\(\s*"[^"]*"\s*\)/g
  const mapMatches: string[] = []
  let result = rest.replace(mapRegex, match => {
    mapMatches.push(match)
    return `__MAP_PLACEHOLDER_${mapMatches.length - 1}__`
  })

  // @relation(...) 안의 내용도 보호 (여기서는 모두 camelCase)
  const relationRegex = /@relation\s*\([^)]*\)/g
  const relationMatches: string[] = []
  result = result.replace(relationRegex, match => {
    // @relation 안에서는 모두 camelCase로 변환
    const convertedRelation = match.replace(/\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g, m => {
      if (isSnakeCase(m)) {
        return toCamelCase(m)
      }
      return m
    })
    relationMatches.push(convertedRelation)
    return `__RELATION_PLACEHOLDER_${relationMatches.length - 1}__`
  })

  // 첫 번째 단어(타입)는 PascalCase로, 배열 내부는 camelCase로 변환
  let isFirst = isFirstWord
  result = result.replace(/\b([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/g, match => {
    if (isSnakeCase(match)) {
      const converted = isFirst ? toPascalCase(match) : toCamelCase(match)
      isFirst = false
      return converted
    }
    // snake_case가 아니어도 첫 단어 플래그는 업데이트
    if (/^[a-zA-Z]/.test(match)) {
      isFirst = false
    }
    return match
  })

  // @relation() 부분 복원
  relationMatches.forEach((relationContent, index) => {
    result = result.replace(`__RELATION_PLACEHOLDER_${index}__`, relationContent)
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
  let currentModelOriginalName: string | null = null
  let modelNeedsMap = false

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
      // 모델 블록이 끝날 때 @@map 추가
      if (currentBlock === 'model' && modelNeedsMap && currentModelOriginalName) {
        // 이미 @@map이 있는지 확인 (현재 모델 블록 내에서만)
        let modelStartIndex = -1
        for (let j = convertedLines.length - 1; j >= 0; j--) {
          if (convertedLines[j].trim().startsWith('model ')) {
            modelStartIndex = j
            break
          }
        }
        const currentModelLines = modelStartIndex >= 0 ? convertedLines.slice(modelStartIndex) : []
        const hasExistingMap = currentModelLines.some(l => l.trim().startsWith('@@map('))

        if (!hasExistingMap) {
          // 마지막 줄의 인덴트를 찾기
          const indent = line.match(/^(\s*)/)?.[1] || ''
          // } 앞에 @@map 추가
          convertedLines.push(`${indent}  @@map("${currentModelOriginalName}")`)
        }
      }
      currentBlock = null
      currentModelOriginalName = null
      modelNeedsMap = false
    }

    // 모델 이름 변환 (model user_profile -> model UserProfile)
    if (trimmed.startsWith('model ')) {
      const modelMatch = line.match(/^(\s*model\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s*{?)$/)
      if (modelMatch) {
        const [, prefix, modelName, suffix] = modelMatch
        if (isSnakeCase(modelName)) {
          currentModelOriginalName = modelName
          modelNeedsMap = true
          convertedLines.push(`${prefix}${toPascalCase(modelName)}${suffix}`)
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

    // @@index, @@unique 등 모델 속성 내 필드 참조 변환
    if (currentBlock === 'model' && /^\s+@@(index|unique|id)/.test(line)) {
      // @@index([mobile_hash], ...) 같은 패턴에서 필드명 변환
      line = line.replace(/\[([^\]]+)\]/g, (_match, fields) => {
        // 쉼표로 구분된 필드들 변환
        const convertedFields = fields
          .split(',')
          .map((field: string) => {
            const trimmed = field.trim()
            if (isSnakeCase(trimmed)) {
              return toCamelCase(trimmed)
            }
            return field
          })
          .join(',')
        return `[${convertedFields}]`
      })
    }

    // 필드 이름 변환 (model, type 블록 내에서만)
    const fieldMatch = line.match(/^(\s+)([a-zA-Z_][a-zA-Z0-9_]*)(\s+.*)$/)
    if (fieldMatch && (currentBlock === 'model' || currentBlock === 'type')) {
      const [, indent, fieldName, rest] = fieldMatch

      // Prisma 스칼라 타입인지 확인 (스칼라 타입이 아니면 관계 필드)
      // https://www.prisma.io/docs/orm/reference/prisma-schema-reference#model-field-scalar-types
      const scalarTypes = ['String', 'Boolean', 'Int', 'BigInt', 'Float', 'Decimal', 'DateTime', 'Json', 'Bytes', 'Unsupported']

      // 타입 추출: "Type", "Type?", "Type[]" 형태에서 Type 부분만
      const typeMatch = rest.match(/^\s+([A-Z][a-zA-Z0-9_]*)[?[\]]?/)
      const fieldType = typeMatch ? typeMatch[1] : null

      // 스칼라 타입이 아니면 관계 필드
      const isRelationField = fieldType ? !scalarTypes.includes(fieldType) : false

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
