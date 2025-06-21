-- 询价系统消息翻译
-- 创建时间: 2024
-- 说明: 询价功能相关的多语言消息键

USE vehicle_supplies_db;

-- 询价系统消息键翻译
INSERT INTO language_translations (guid, code, lang, value) VALUES
-- 询价创建
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.SUCCESS', 'en', 'Inquiry created successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.SUCCESS', 'zh-CN', '询价单创建成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.FAILED', 'en', 'Failed to create inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.CREATE.FAILED', 'zh-CN', '询价单创建失败'),

-- 询价获取
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.FETCH.SUCCESS', 'en', 'Inquiries retrieved successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.FETCH.SUCCESS', 'zh-CN', '询价单获取成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.FETCH.FAILED', 'en', 'Failed to fetch inquiries'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.FETCH.FAILED', 'zh-CN', '询价单获取失败'),

-- 询价消息
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.MESSAGE.SEND_SUCCESS', 'en', 'Message sent successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.MESSAGE.SEND_SUCCESS', 'zh-CN', '消息发送成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.MESSAGE.SEND_FAILED', 'en', 'Failed to send message'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.MESSAGE.SEND_FAILED', 'zh-CN', '消息发送失败'),

-- 询价更新
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.UPDATE.SUCCESS', 'en', 'Inquiry updated successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.UPDATE.SUCCESS', 'zh-CN', '询价单更新成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.UPDATE.FAILED', 'en', 'Failed to update inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.UPDATE.FAILED', 'zh-CN', '询价单更新失败'),

-- 询价删除
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.DELETE.SUCCESS', 'en', 'Inquiry deleted successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.DELETE.SUCCESS', 'zh-CN', '询价单删除成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.DELETE.FAILED', 'en', 'Failed to delete inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.DELETE.FAILED', 'zh-CN', '询价单删除失败'),

-- 询价商品操作
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.ADD.SUCCESS', 'en', 'Product added to inquiry successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.ADD.SUCCESS', 'zh-CN', '商品添加到询价单成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.ADD.FAILED', 'en', 'Failed to add product to inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.ADD.FAILED', 'zh-CN', '商品添加到询价单失败'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.UPDATE.SUCCESS', 'en', 'Inquiry item updated successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.UPDATE.SUCCESS', 'zh-CN', '询价商品更新成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.UPDATE.FAILED', 'en', 'Failed to update inquiry item'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.UPDATE.FAILED', 'zh-CN', '询价商品更新失败'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.DELETE.SUCCESS', 'en', 'Inquiry item deleted successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.DELETE.SUCCESS', 'zh-CN', '询价商品删除成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.DELETE.FAILED', 'en', 'Failed to delete inquiry item'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.ITEM.DELETE.FAILED', 'zh-CN', '询价商品删除失败'),

-- 询价报价
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.QUOTE.SUCCESS', 'en', 'Quote updated successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.QUOTE.SUCCESS', 'zh-CN', '报价更新成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.QUOTE.FAILED', 'en', 'Failed to update quote'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.QUOTE.FAILED', 'zh-CN', '报价更新失败'),

-- 询价状态
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.STATUS.UPDATE.SUCCESS', 'en', 'Inquiry status updated successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.STATUS.UPDATE.SUCCESS', 'zh-CN', '询价单状态更新成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.STATUS.UPDATE.FAILED', 'en', 'Failed to update inquiry status'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.STATUS.UPDATE.FAILED', 'zh-CN', '询价单状态更新失败'),

-- 同步到购物车
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.SYNC_CART.SUCCESS', 'en', 'Inquiry synced to cart successfully'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.SYNC_CART.SUCCESS', 'zh-CN', '询价单同步到购物车成功'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.SYNC_CART.FAILED', 'en', 'Failed to sync inquiry to cart'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.SYNC_CART.FAILED', 'zh-CN', '询价单同步到购物车失败'),

-- 验证错误
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.INVALID_ID', 'en', 'Invalid inquiry ID'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.INVALID_ID', 'zh-CN', '无效的询价单ID'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.NOT_FOUND', 'en', 'Inquiry not found'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.NOT_FOUND', 'zh-CN', '询价单不存在'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.ACCESS_DENIED', 'en', 'Access denied'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.ACCESS_DENIED', 'zh-CN', '访问被拒绝'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.MAX_INQUIRIES', 'en', 'Maximum number of inquiries reached (10)'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.MAX_INQUIRIES', 'zh-CN', '已达到询价单数量上限（10个）'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.PRODUCT_EXISTS', 'en', 'Product already exists in inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.PRODUCT_EXISTS', 'zh-CN', '商品已存在于询价单中'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.INVALID_QUANTITY', 'en', 'Invalid quantity'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.INVALID_QUANTITY', 'zh-CN', '无效的数量'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.INVALID_PRICE', 'en', 'Invalid price'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.VALIDATION.INVALID_PRICE', 'zh-CN', '无效的价格'),

-- 权限相关
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.PERMISSION.USER_ONLY', 'en', 'Only users can create inquiries'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.PERMISSION.USER_ONLY', 'zh-CN', '只有用户可以创建询价单'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.PERMISSION.ADMIN_ONLY', 'en', 'Admin access required'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.PERMISSION.ADMIN_ONLY', 'zh-CN', '需要管理员权限'),

-- 业务逻辑错误
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.BUSINESS.CANNOT_MODIFY_COMPLETED', 'en', 'Cannot modify completed inquiry'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.BUSINESS.CANNOT_MODIFY_COMPLETED', 'zh-CN', '无法修改已完成的询价单'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.BUSINESS.CANNOT_DELETE_WITH_MESSAGES', 'en', 'Cannot delete inquiry with messages'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.BUSINESS.CANNOT_DELETE_WITH_MESSAGES', 'zh-CN', '无法删除有消息的询价单'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.BUSINESS.PRODUCT_NOT_AVAILABLE', 'en', 'Product is not available'),
(UNHEX(REPLACE(UUID(), '-', '')), 'INQUIRY.BUSINESS.PRODUCT_NOT_AVAILABLE', 'zh-CN', '商品不可用');