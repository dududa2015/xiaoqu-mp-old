/** 楼号快速输入。根据已输入的楼栋号生成相邻推荐。 */

/** 按数字、字母或中文楼名给出后缀建议。 */
function generateSuggestions(input) {
  if (!input || input.trim() === '') {
    return []
  }
  const cleanInput = input.trim()
  const suffixes = {
    primary: ['号楼', '栋', '幢', '座'],
    secondary: ['单元', '片区', '期'],
    special: ['号', '区', '街', '路']
  }
  const hasSuffix = suffixes.primary.concat(suffixes.secondary, suffixes.special)
    .some((suffix) => cleanInput.indexOf(suffix) !== -1)
  if (hasSuffix) {
    const core = extractCorePart(cleanInput)
    if (core && core !== cleanInput) {
      return [core + '号楼', core + '栋', core + '座']
    }
    return []
  }
  let suggestions = []
  if (/^[\d\-]+$/.test(cleanInput)) {
    suggestions = suffixes.primary.map((suffix) => cleanInput + suffix)
    if (cleanInput.indexOf('-') !== -1) {
      suggestions.push(cleanInput.replace('-', '') + '单元')
      suggestions.push(cleanInput + '室')
    }
  } else if (/^[A-Za-z]+$/.test(cleanInput)) {
    suggestions = suffixes.primary.map((suffix) => cleanInput.toUpperCase() + suffix)
  } else if (/^[A-Za-z]+\d+$/.test(cleanInput)) {
    suggestions = suffixes.primary.map((suffix) => cleanInput + suffix)
    const letters = cleanInput.match(/[A-Za-z]+/)[0]
    const numbers = cleanInput.match(/\d+/)[0]
    suggestions.push(letters + '座' + numbers + '号')
    suggestions.push(letters + '栋' + numbers + '单元')
  } else if (/^\d+[A-Za-z]+$/.test(cleanInput)) {
    suggestions = suffixes.primary.map((suffix) => cleanInput + suffix)
    suggestions.push(cleanInput + '室')
  } else if (/^[一二三四五六七八九十百千万]+$/.test(cleanInput)) {
    suggestions = suffixes.secondary.map((suffix) => cleanInput + suffix)
    suggestions.push(cleanInput + '号楼')
    const arabicNum = chineseToArabic(cleanInput)
    if (arabicNum) {
      suggestions.push(arabicNum + '号楼')
      suggestions.push(arabicNum + '单元')
    }
  } else {
    const numbers = cleanInput.match(/\d+/g)
    const letters = cleanInput.match(/[A-Za-z]+/g)
    if (numbers && numbers.length) {
      const num = numbers.join('')
      suggestions = suffixes.primary.map((suffix) => num + suffix)
    } else if (letters && letters.length) {
      const letter = letters.join('').toUpperCase()
      suggestions = suffixes.primary.map((suffix) => letter + suffix)
    }
  }
  suggestions = Array.from(new Set(suggestions)).slice(0, 6)
  if (!suggestions.length) {
    suggestions = [cleanInput + '号楼', cleanInput + '栋', cleanInput + '座']
  }
  return suggestions
}

/** 去掉号楼、栋等后缀，留下可继续推荐的部分。 */
function extractCorePart(input) {
  const suffixes = ['号楼', '栋', '幢', '座', '单元', '号', '区', '期', '层']
  let core = input
  for (let i = 0; i < suffixes.length; i++) {
    const suffix = suffixes[i]
    if (core.slice(-suffix.length) === suffix) {
      core = core.slice(0, -suffix.length)
      break
    }
  }
  return core !== input ? core : null
}

/** 中文数字转成阿拉伯数字，便于算邻居楼。 */
function chineseToArabic(chinese) {
  const map = {
    一: '1', 二: '2', 三: '3', 四: '4', 五: '5',
    六: '6', 七: '7', 八: '8', 九: '9', 十: '10'
  }
  if (chinese.length === 1) {
    return map[chinese] || null
  }
  if (chinese === '十') {
    return '10'
  }
  if (chinese.indexOf('十') === 0) {
    const unit = map[chinese[1]]
    return unit ? '1' + unit : '10'
  }
  if (chinese.slice(-1) === '十') {
    const tens = map[chinese[0]]
    return tens ? tens + '0' : null
  }
  return null
}

/** 以当前楼为中心，推荐前后几栋。 */
function generateNeighborBuildings(input) {
  if (!input || typeof input !== 'string' || !input.trim()) {
    return ['1号楼', '2号楼', 'A座', 'B座']
  }
  const building = input.trim()
  const neighbors = []
  const chineseToNumber = {
    一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
    六: 6, 七: 7, 八: 8, 九: 9, 十: 10
  }
  const chineseKeys = Object.keys(chineseToNumber)
  for (let i = 0; i < chineseKeys.length; i++) {
    const chinese = chineseKeys[i]
    if (building.indexOf(chinese) !== 0) {
      continue
    }
    const num = chineseToNumber[chinese]
    const suffix = building.substring(chinese.length)
    const prevChinese = chineseKeys.find((key) => chineseToNumber[key] === num - 1)
    if (prevChinese && num > 1) {
      neighbors.push(prevChinese + suffix)
    }
    const nextChinese = chineseKeys.find((key) => chineseToNumber[key] === num + 1)
    if (nextChinese) {
      neighbors.push(nextChinese + suffix)
    }
    return neighbors
  }
  const letterMatch = building.match(/^([A-Za-z])(.+)$/)
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase()
    const suffix = letterMatch[2]
    const prevCode = letter.charCodeAt(0) - 1
    const nextCode = letter.charCodeAt(0) + 1
    neighbors.push((prevCode < 65 ? 'Z' : String.fromCharCode(prevCode)) + suffix)
    neighbors.push((nextCode > 90 ? 'A' : String.fromCharCode(nextCode)) + suffix)
    return neighbors
  }
  const numbers = building.match(/\d+/g)
  if (!numbers || !numbers.length) {
    return []
  }
  const lastNumber = numbers[numbers.length - 1]
  const num = parseInt(lastNumber, 10)
  const lastIndex = building.lastIndexOf(lastNumber)
  const prefix = building.substring(0, lastIndex)
  const suffix = building.substring(lastIndex + lastNumber.length)
  if (num > 0) {
    neighbors.push(prefix + (num - 1) + suffix)
  }
  neighbors.push(prefix + (num + 1) + suffix)
  return neighbors
}

/** 把字符串列表变成可点选的芯片。 */
function toChips(list, checkedName) {
  return (list || []).map((name) => ({
    name: name,
    checked: name === checkedName
  }))
}

module.exports = {
  generateSuggestions,
  generateNeighborBuildings,
  toChips
}
