/**
 * 订单状态工具函数
 */

/**
 * 获取订单状态对应的翻译键
 * @param {string} status - 订单状态
 * @returns {string} 翻译键
 */
export function getOrderStatusKey(status) {
  const statusKeyMap = {
    'pending': 'order.status.pending',
    'paid': 'order.status.paid',
    'shipped': 'order.status.shipped',
    'delivered': 'order.status.delivered',
    'cancelled': 'order.status.cancelled',
    'pay_timeout': 'order.status.payTimeout',
    'refund_requested': 'order.status.refundRequested',
    'refund_approved': 'order.status.refundApproved',
    'refund_rejected': 'order.status.refundRejected',
    'refund_cancelled': 'order.status.refundCancelled',
    'return_shipped': 'order.status.returnShipped',
    'return_delivered': 'order.status.returnDelivered',
    'refunded': 'order.status.refunded'
  };
  
  return statusKeyMap[status] || status;
}

/**
 * 获取订单状态对应的CSS类名
 * @param {string} status - 订单状态
 * @returns {object} CSS类名对象
 */
export function getOrderStatusClass(status) {
  return {
    'status-pending': status === 'pending',
    'status-paid': status === 'paid',
    'status-shipped': status === 'shipped',
    'status-delivered': status === 'delivered',
    'status-cancelled': status === 'cancelled',
    'status-pay-timeout': status === 'pay_timeout',
    'status-refund-requested': status === 'refund_requested',
    'status-refund-approved': status === 'refund_approved',
    'status-refund-rejected': status === 'refund_rejected',
    'status-refund-cancelled': status === 'refund_cancelled',
    'status-return-shipped': status === 'return_shipped',
    'status-return-delivered': status === 'return_delivered',
    'status-refunded': status === 'refunded'
  };
}