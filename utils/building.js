/**
 * 根据输入内容，生成带后缀的候选词列表（优化版）
 * @param {string} input - 用户输入的文本，如 "12"、"A"、"三"、"12-3"、"A座"
 * @returns {string[]} 候选词数组
 */
function generateSuggestions(input) {
  if (!input || input.trim() === '') return [];
  
  // 清理输入：去除首尾空格，保留内部空格（如"B 座"）
  const cleanInput = input.trim();
  
  // 定义常用后缀（按使用频率排序）
  const suffixes = {
    // 适用于数字/字母的主后缀
    primary: ["号楼", "栋", "幢", "座"],
    // 适用于中文的次后缀
    secondary: ["单元", "片区", "期"],
    // 单元/楼层相关
    unit: ["单元", "号楼", "楼", "层"],
    // 特殊后缀（直接输入的无需再加）
    special: ["号", "区", "街", "路"]
  };
  
  // 判断输入是否已经包含常见后缀
  const hasSuffix = suffixes.primary.concat(suffixes.secondary, suffixes.special)
    .some(suffix => cleanInput.includes(suffix));
  
  // 如果已经包含后缀，不再生成候选，直接返回空（或返回一个不带后缀的纠错选项）
  if (hasSuffix) {
    // 尝试提取核心数字/字母部分
    const core = extractCorePart(cleanInput);
    if (core && core !== cleanInput) {
      return [`${core}号楼`, `${core}栋`, `${core}座`];
    }
    return [];
  }
  
  let suggestions = [];
  
  // 规则1：纯数字（包括带横杠的复合数字，如"12-3"）
  if (/^[\d\-]+$/.test(cleanInput)) {
    // 数字类：常用后缀全上
    suggestions = suffixes.primary.map(suffix => cleanInput + suffix);
    
    // 如果包含横杠（如12-3），再加单元相关
    if (cleanInput.includes('-')) {
      suggestions.push(cleanInput.replace('-', '') + '单元');
      suggestions.push(cleanInput + '室');
    }
  }
  
  // 规则2：纯字母（A-Z，包括大小写）
  else if (/^[A-Za-z]+$/.test(cleanInput)) {
    suggestions = suffixes.primary.map(suffix => cleanInput.toUpperCase() + suffix);
  }
  
  // 规则3：字母+数字混合（如"A12"、"B3"）
  else if (/^[A-Za-z]+\d+$/.test(cleanInput)) {
    // 先原样保留
    suggestions = suffixes.primary.map(suffix => cleanInput + suffix);
    
    // 再拆分：单独字母 + 单独数字
    const letters = cleanInput.match(/[A-Za-z]+/)[0];
    const numbers = cleanInput.match(/\d+/)[0];
    suggestions.push(`${letters}座${numbers}号`);
    suggestions.push(`${letters}栋${numbers}单元`);
  }
  
  // 规则4：数字+字母混合（如"12A"）
  else if (/^\d+[A-Za-z]+$/.test(cleanInput)) {
    suggestions = suffixes.primary.map(suffix => cleanInput + suffix);
    suggestions.push(cleanInput + '室');
  }
  
  // 规则5：中文数字（一到十）
  else if (/^[一二三四五六七八九十百千万]+$/.test(cleanInput)) {
    // 中文数字加单元、期、片区
    suggestions = suffixes.secondary.map(suffix => cleanInput + suffix);
    
    // 同时支持号楼（但中文+号楼不如数字常见）
    suggestions.push(cleanInput + '号楼');
    
    // 阿拉伯数字版本
    const arabicNum = chineseToArabic(cleanInput);
    if (arabicNum) {
      suggestions.push(arabicNum + '号楼');
      suggestions.push(arabicNum + '单元');
    }
  }
  
  // 规则6：其他情况（可能已经输入部分信息）
  else {
    // 尝试提取纯数字/字母部分
    const numbers = cleanInput.match(/\d+/g);
    const letters = cleanInput.match(/[A-Za-z]+/g);
    
    if (numbers && numbers.length > 0) {
      // 有数字，加常用后缀
      const num = numbers.join('');
      suggestions = suffixes.primary.map(suffix => num + suffix);
    } else if (letters && letters.length > 0) {
      // 只有字母
      const letter = letters.join('').toUpperCase();
      suggestions = suffixes.primary.map(suffix => letter + suffix);
    }
  }
  
  // 去重并限制数量
  suggestions = [...new Set(suggestions)].slice(0, 6);
  
  // 如果没有任何候选，返回一个兜底选项
  if (suggestions.length === 0) {
    suggestions = [`${cleanInput}号楼`, `${cleanInput}栋`, `${cleanInput}座`];
  }
  
  return suggestions;
}

/**
 * 提取输入的核心部分（去除已知后缀）
 */
function extractCorePart(input) {
  const suffixes = ["号楼", "栋", "幢", "座", "单元", "号", "区", "期", "层"];
  let core = input;
  
  for (let suffix of suffixes) {
    if (core.endsWith(suffix)) {
      core = core.slice(0, -suffix.length);
      break;
    }
  }
  
  return core !== input ? core : null;
}

/**
 * 中文数字转阿拉伯数字（简化版）
 */
function chineseToArabic(chinese) {
  const map = {
    '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
    '六': '6', '七': '7', '八': '8', '九': '9', '十': '10'
  };
  
  // 简单处理，只支持个位数和十
  if (chinese.length === 1) {
    return map[chinese] || null;
  }
  
  if (chinese === '十') return '10';
  if (chinese.startsWith('十')) {
    // 十一 → 11, 十二 → 12
    const unit = map[chinese[1]];
    return unit ? '1' + unit : '10';
  }
  if (chinese.endsWith('十')) {
    // 二十 → 20, 三十 → 30
    const tens = map[chinese[0]];
    return tens ? tens + '0' : null;
  }
  
  return null;
}

module.exports = {
  generateSuggestions
}