/**
 * 通用校验工具函数
 */

/**
 * 国际电话号码校验
 * 支持国际通用的电话号码格式
 * @param {string} phone - 电话号码
 * @returns {boolean} - 是否有效
 */
export function validateInternationalPhone(phone) {
  if (!phone) return false
  
  // 移除所有空格、连字符、括号等非数字字符
  const cleanPhone = phone.replace(/[\s-()+]/g, '')
  
  // 基本规则：
  // 1. 只包含数字
  // 2. 长度在7-15位之间（国际标准）
  // 3. 不能全是相同数字
  const phoneRegex = /^\d{7,15}$/
  
  if (!phoneRegex.test(cleanPhone)) {
    return false
  }
  
  // 检查是否全是相同数字（如：1111111111）
  const allSameDigit = /^(\d)\1+$/.test(cleanPhone)
  if (allSameDigit) {
    return false
  }
  
  return true
}

/**
 * 带区号的国际电话号码校验
 * @param {string} countryCode - 国家区号（如：+86）
 * @param {string} phone - 电话号码
 * @returns {boolean} - 是否有效
 */
export function validatePhoneWithCountryCode(countryCode, phone) {
  if (!countryCode || !phone) return false
  
  // 校验区号格式
  const countryCodeRegex = /^\+\d{1,4}$/
  if (!countryCodeRegex.test(countryCode)) {
    return false
  }
  
  // 校验电话号码
  return validateInternationalPhone(phone)
}

/**
 * 完整的国际电话号码校验（包含区号）
 * @param {string} fullPhone - 完整电话号码（如：+86 138 0013 8000）
 * @returns {boolean} - 是否有效
 */
export function validateFullInternationalPhone(fullPhone) {
  if (!fullPhone) return false
  
  // 移除空格和连字符
  const cleanPhone = fullPhone.replace(/[\s-]/g, '')
  
  // 匹配 +国家码 + 电话号码的格式
  const fullPhoneRegex = /^\+(\d{1,4})(\d{7,15})$/
  const match = cleanPhone.match(fullPhoneRegex)
  
  if (!match) {
    return false
  }
  
  const [, countryCode, phoneNumber] = match
  
  // 校验国家码（1-4位数字）
  if (countryCode.length < 1 || countryCode.length > 4) {
    return false
  }
  
  // 校验电话号码部分
  return validateInternationalPhone(phoneNumber)
}

/**
 * 邮政编码校验（基础版本，支持多种格式）
 * @param {string} postalCode - 邮政编码
 * @param {string} countryCode - 国家代码（可选，用于特定国家的校验）
 * @returns {boolean} - 是否有效
 */
export function validatePostalCode(postalCode, countryCode = null) {
  if (!postalCode) return true // 邮政编码不是必填项
  
  // 基本格式：3-10位数字或字母数字组合
  const basicRegex = /^[A-Za-z0-9\s-]{3,10}$/
  
  if (!basicRegex.test(postalCode)) {
    return false
  }
  
  // 如果提供了国家代码，可以进行更精确的校验
  if (countryCode) {
    switch (countryCode.toUpperCase()) {
      case 'CN': // 中国：6位数字
        return /^\d{6}$/.test(postalCode)
      case 'US': // 美国：5位数字或5+4格式
        return /^\d{5}(-\d{4})?$/.test(postalCode)
      case 'CA': // 加拿大：A1A 1A1格式
        return /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(postalCode)
      case 'GB': // 英国：复杂格式
        return /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/.test(postalCode)
      default:
        return basicRegex.test(postalCode)
    }
  }
  
  return true
}

/**
 * 邮箱格式校验
 * @param {string} email - 邮箱地址
 * @returns {boolean} - 是否有效
 */
export function validateEmail(email) {
  if (!email) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 姓名校验
 * @param {string} name - 姓名
 * @returns {boolean} - 是否有效
 */
export function validateName(name) {
  if (!name) return false
  
  // 移除首尾空格
  const trimmedName = name.trim()
  
  // 长度在1-50字符之间，支持中文、英文、空格、连字符、撇号
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z\s-']{1,50}$/
  
  return nameRegex.test(trimmedName)
}