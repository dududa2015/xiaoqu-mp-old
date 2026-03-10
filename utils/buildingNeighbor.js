function generateNeighborBuildings(input) {
  if (!input || typeof input !== 'string') return ['1号楼', '2号楼'];
  
  const building = input.trim();
  if (building === '') return ['1号楼', '2号楼'];
  
  const neighbors = [];
  
  // 处理中文数字
  const chineseToNumber = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
  };
  
  for (let chinese in chineseToNumber) {
    if (building.startsWith(chinese)) {
      const num = chineseToNumber[chinese];
      const suffix = building.substring(chinese.length);
      
      const prevChinese = Object.keys(chineseToNumber).find(key => chineseToNumber[key] === num - 1);
      if (prevChinese && num > 1) {
        neighbors.push(prevChinese + suffix);
      }
      
      const nextChinese = Object.keys(chineseToNumber).find(key => chineseToNumber[key] === num + 1);
      if (nextChinese) {
        neighbors.push(nextChinese + suffix);
      }
      
      return neighbors;
    }
  }
  
  // 处理单个字母（如 A号楼）
  const letterMatch = building.match(/^([A-Za-z])(.+)$/);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const suffix = letterMatch[2];
    
    // 计算前一个字母（循环：A前面是Z）
    const prevCharCode = letter.charCodeAt(0) - 1;
    const prevLetter = prevCharCode < 65 ? 'Z' : String.fromCharCode(prevCharCode);
    neighbors.push(prevLetter + suffix);
    
    // 计算后一个字母（循环：Z后面是A）
    const nextCharCode = letter.charCodeAt(0) + 1;
    const nextLetter = nextCharCode > 90 ? 'A' : String.fromCharCode(nextCharCode);
    neighbors.push(nextLetter + suffix);
    
    return neighbors;
  }
  
  // 处理阿拉伯数字
  const numbers = building.match(/\d+/g);
  if (!numbers || numbers.length === 0) return [];
  
  const lastNumber = numbers[numbers.length - 1];
  const num = parseInt(lastNumber, 10);
  const lastIndex = building.lastIndexOf(lastNumber);
  
  const prefix = building.substring(0, lastIndex);
  const suffix = building.substring(lastIndex + lastNumber.length);
  
  if (num > 0) {
    neighbors.push(prefix + (num - 1) + suffix);
  }
  neighbors.push(prefix + (num + 1) + suffix);
  
  return neighbors;
}

module.exports = {
  generateNeighborBuildings
};