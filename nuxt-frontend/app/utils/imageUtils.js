/**
 * 图片工具函数
 */
import defaultImage from '../assets/images/default-image.svg';

/**
 * 处理图片加载错误
 * 当图片加载失败时，将图片源替换为默认图片
 * @param {Event} e - 错误事件对象
 */
export const handleImageError = (e) => {
  // 检查事件对象和target是否存在
  if (e && e.target && e.target.tagName === 'IMG') {
    e.target.src = defaultImage;
  }
};

export default {
  handleImageError
};