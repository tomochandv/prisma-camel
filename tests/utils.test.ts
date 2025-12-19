import { toCamelCase, isSnakeCase } from '../src/utils'

describe('utils', () => {
  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('user_name')).toBe('userName')
      expect(toCamelCase('user_profile')).toBe('userProfile')
      expect(toCamelCase('blog_post')).toBe('blogPost')
    })

    it('should handle multiple underscores', () => {
      expect(toCamelCase('this_is_a_test')).toBe('thisIsATest')
      expect(toCamelCase('user_email_address')).toBe('userEmailAddress')
    })

    it('should handle single word (no underscores)', () => {
      expect(toCamelCase('user')).toBe('user')
      expect(toCamelCase('name')).toBe('name')
    })

    it('should convert words separated by underscores', () => {
      expect(toCamelCase('user_id')).toBe('userId')
      expect(toCamelCase('first_name')).toBe('firstName')
      expect(toCamelCase('is_active')).toBe('isActive')
    })
  })

  describe('isSnakeCase', () => {
    it('should return true for valid snake_case', () => {
      expect(isSnakeCase('user_name')).toBe(true)
      expect(isSnakeCase('user_profile')).toBe(true)
      expect(isSnakeCase('blog_post')).toBe(true)
      expect(isSnakeCase('this_is_a_test')).toBe(true)
    })

    it('should return true for snake_case with numbers in middle', () => {
      expect(isSnakeCase('user_id')).toBe(true)
      expect(isSnakeCase('field_name')).toBe(true)
      expect(isSnakeCase('value_1a')).toBe(true)
    })

    it('should return false for camelCase', () => {
      expect(isSnakeCase('userName')).toBe(false)
      expect(isSnakeCase('userProfile')).toBe(false)
    })

    it('should return false for single word', () => {
      expect(isSnakeCase('user')).toBe(false)
      expect(isSnakeCase('name')).toBe(false)
    })

    it('should return false for PascalCase', () => {
      expect(isSnakeCase('UserName')).toBe(false)
      expect(isSnakeCase('BlogPost')).toBe(false)
    })

    it('should return false for invalid patterns', () => {
      expect(isSnakeCase('_user_name')).toBe(false) // starts with underscore
      expect(isSnakeCase('user__name')).toBe(false) // double underscore
      expect(isSnakeCase('user_Name')).toBe(false) // uppercase after underscore
    })
  })
})
