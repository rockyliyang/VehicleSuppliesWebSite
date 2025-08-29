/**
 * 价格计算工具类
 * 提供基于数量和价格范围的价格计算功能
 */

/**
 * 根据数量和价格范围计算对应的价格
 * @param {Array} priceRanges - 价格范围数组，每个元素包含 min_quantity, max_quantity, price
 * @param {number} quantity - 商品数量
 * @returns {number|null} 计算出的价格，如果没有匹配的范围则返回null
 */
export const calculatePriceByQuantity = (priceRanges, quantity) => {
  if (!priceRanges || priceRanges.length === 0) {
    return null;
  }
  
  for (let range of priceRanges) {
    if (quantity >= range.min_quantity && (range.max_quantity === null || quantity <= range.max_quantity)) {
      return range.price;
    }
  }
  
  return null;
};

/**
 * 更新商品的计算价格
 * @param {Object} item - 商品对象，包含 price_ranges, quantity, price 等属性
 * @param {number} unitPrice - 可选的单价，如果提供则优先使用（主要用于询价单场景）
 * @returns {number} 计算出的价格
 */
export const updateItemCalculatedPrice = (item) => {
  
  // Cart.vue场景：如果商品有价格范围，根据数量计算价格
  if (item.price_ranges && item.price_ranges.length > 0) {
    const calculatedPrice = calculatePriceByQuantity(item.price_ranges, item.quantity);
    if (calculatedPrice !== null) {
      item.calculatedPrice = calculatedPrice;
      return calculatedPrice;
    }
  }
  
  // 如果没有price_ranges或计算失败，使用原始价格
  item.calculatedPrice = item.price || item.original_price || 0;
  return item.calculatedPrice;
};

/**
 * 批量更新商品列表的计算价格
 * @param {Array} items - 商品列表
 * @param {Object} unitPrices - 可选的单价映射，key为商品ID，value为单价
 */
export const updateAllItemsCalculatedPrice = (items) => {
  items.forEach(item => {
    updateItemCalculatedPrice(item);
  });
};

/**
 * 根据商品信息获取对应的价格
 * @param {Object|Array} item - 商品对象
 * @returns {number} 计算出的价格
 */
export const getPriceByRange = (item) => {
  // 确保不修改原始对象，创建一个浅拷贝
  const itemCopy = { ...item };
  const priceRanges = itemCopy?.price_ranges;
 
  // 如果有详细的价格范围数据，显示详细信息
  if (Array.isArray(priceRanges) && priceRanges.length > 0) {
    const calculatedPrice = calculatePriceByQuantity(priceRanges, itemCopy.quantity);
    if (calculatedPrice !== null) {
      return calculatedPrice;
    }
  }
  
  return itemCopy.price || itemCopy.original_price || 0;
};

/**
 * 获取价格范围的显示文本
 * @param {Object|Array} item - 商品对象
 * @param {Function} formatPrice - 价格格式化函数
 * @returns {string} 格式化的价格范围显示文本
 */
export const getPriceRangeDisplayUtil = (item, formatPrice) => {
  return formatPrice(getPriceByRange(item));
};