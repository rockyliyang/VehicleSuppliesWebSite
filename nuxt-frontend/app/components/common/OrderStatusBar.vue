<template>
  <div class="order-status-bar">
    <div class="status-steps">
      <div v-for="(step, index) in getOrderStatusSteps()" :key="step.key" class="status-step" :class="{
          'active': index <= getCurrentStepIndex(),
          'current': index === getCurrentStepIndex(),
          'completed': index < getCurrentStepIndex(),
          'cancelled': step.key === 'cancelled' || step.key === 'pay_timeout' || step.key === 'refund_rejected' || step.key === 'refund_cancelled',
          'refund': ['refund_requested', 'refund_approved', 'return_shipped', 'return_delivered', 'refunded'].includes(step.key)
        }">
        <div class="step-icon">
          <el-icon>
            <Document v-if="step.icon === 'Document'" />
            <Money v-else-if="step.icon === 'Money'" />
            <Van v-else-if="step.icon === 'Van'" />
            <Check v-else-if="step.icon === 'Check'" />
            <Close v-else-if="step.icon === 'Close'" />
            <Clock v-else-if="step.icon === 'Clock'" />
            <RefreshLeft v-else-if="step.icon === 'RefreshLeft'" />
            <Select v-else-if="step.icon === 'Select'" />
          </el-icon>
        </div>
        <div class="step-label">{{ step.label }}</div>
        <div v-if="orderData.created_at && step.key === 'pending'" class="step-time">
          {{ formatDate(orderData.created_at) }}
        </div>
        <div v-else-if="orderData.paid_at && step.key === 'paid'" class="step-time">
          {{ formatDate(orderData.paid_at) }}
        </div>
        <div v-else-if="orderData.shipped_at && step.key === 'shipped'" class="step-time">
          {{ formatDate(orderData.shipped_at) }}
        </div>
        <div v-else-if="orderData.delivered_at && step.key === 'delivered'" class="step-time">
          {{ formatDate(orderData.delivered_at) }}
        </div>

        <!-- 连接线和等待文本 -->
        <div v-if="index < getOrderStatusSteps().length - 1" class="step-connector" :class="{
            'active': index < getCurrentStepIndex(),
            'cancelled': getOrderStatusSteps()[index + 1].key === 'cancelled' || getOrderStatusSteps()[index + 1].key === 'pay_timeout' || getOrderStatusSteps()[index + 1].key === 'refund_rejected' || getOrderStatusSteps()[index + 1].key === 'refund_cancelled'
          }">
          <div class="connector-line"></div>
          <div v-if="getStepConnectionText(getCurrentStepIndex(), index)" class="connector-text">
            {{ getStepConnectionText(getCurrentStepIndex(), index) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Document, Money, Van, Check, Close, Clock, RefreshLeft, Select } from '@element-plus/icons-vue';

export default {
  name: 'OrderStatusBar',
  components: {
    Document,
    Money,
    Van,
    Check,
    Close,
    Clock,
    RefreshLeft,
    Select
  },
  props: {
    orderData: {
      type: Object,
      required: true
    }
  },
  methods: {
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // 获取订单状态条配置
    getOrderStatusSteps() {
      const status = this.orderData?.status;
      
      // 正常订单流程
      const normalSteps = [
        { key: 'pending', label: this.$t('payment.steps.orderSubmitted'), icon: 'Document' },
        { key: 'paid', label: this.$t('payment.steps.paymentSuccess'), icon: 'Money' },
        { key: 'shipped', label: this.$t('payment.steps.shipped'), icon: 'Van' },
        { key: 'delivered', label: this.$t('payment.steps.completed'), icon: 'Check' }
      ];

      // 退款流程
      const refundSteps = [
        { key: 'refund_requested', label: this.$t('payment.steps.refundRequested'), icon: 'RefreshLeft' },
        { key: 'refund_approved', label: this.$t('payment.steps.refundApproved'), icon: 'Select' },
        { key: 'return_shipped', label: this.$t('payment.steps.returned'), icon: 'Van' },
        { key: 'return_delivered', label: this.$t('payment.steps.returnDelivered'), icon: 'Check' },
        { key: 'refunded', label: this.$t('payment.steps.refunded'), icon: 'Money' }
      ];

      // 根据订单状态返回相应的步骤
      if (['cancelled'].includes(status)) {
        return [
          { key: 'pending', label: this.$t('payment.steps.orderSubmitted'), icon: 'Document' },
          { key: 'cancelled', label: this.$t('payment.steps.cancelled'), icon: 'Close' }
        ];
      } else if (['pay_timeout'].includes(status)) {
        return [
          { key: 'pending', label: this.$t('payment.steps.orderSubmitted'), icon: 'Document' },
          { key: 'pay_timeout', label: this.$t('payment.steps.paymentTimeout'), icon: 'Clock' }
        ];
      } else if (['refund_requested', 'refund_approved', 'return_shipped', 'return_delivered', 'refunded'].includes(status)) {
        return refundSteps;
      } else if (status === 'refund_rejected') {
        return [
          { key: 'refund_requested', label: this.$t('payment.steps.refundRequested'), icon: 'RefreshLeft' },
          { key: 'refund_rejected', label: this.$t('payment.steps.refundRejected'), icon: 'Close' }
        ];
      } else if (status === 'refund_cancelled') {
        return [
          { key: 'refund_requested', label: this.$t('payment.steps.refundRequested'), icon: 'RefreshLeft' },
          { key: 'refund_cancelled', label: this.$t('payment.steps.refundCancelled'), icon: 'Close' }
        ];
      } else {
        return normalSteps;
      }
    },

    // 获取当前步骤索引
    getCurrentStepIndex() {
      const status = this.orderData?.status;
      const steps = this.getOrderStatusSteps();
      return steps.findIndex(step => step.key === status);
    },

    // 获取步骤间的连接线文本
    getStepConnectionText(currentIndex, stepIndex) {
      const status = this.orderData?.status;
      const steps = this.getOrderStatusSteps();
      
      if (stepIndex !== currentIndex || stepIndex === steps.length - 1) {
        return '';
      }

      const connectionTexts = {
        'pending': this.$t('payment.status.waitingPayment'),
        'paid': this.$t('payment.status.waitingShipment'),
        'shipped': this.$t('payment.status.waitingDelivery'),
        'refund_requested': this.$t('payment.status.waitingSellerProcess'),
        'refund_approved': this.$t('payment.status.waitingBuyerReturn'),
        'return_shipped': this.$t('payment.status.waitingSellerConfirm'),
        'return_delivered': this.$t('payment.status.waitingSellerRefund')
      };

      return connectionTexts[status] || '';
    }
  }
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

/* 订单状态条样式 */
.order-status-bar {
  margin-top: $spacing-xl;
  padding: $spacing-lg;
  background: $white;
  border-radius: $border-radius-lg;
  border: 1px solid $border-light;

  .status-steps {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    position: relative;

    @include mobile {
      flex-direction: column;
      gap: $spacing-lg;
    }
  }

  .status-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    flex: 1;
    min-width: 120px;

    @include mobile {
      flex-direction: row;
      text-align: left;
      min-width: auto;
      width: 100%;
    }

    .step-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $gray-200;
      color: $gray-500;
      font-size: 20px;
      margin-bottom: $spacing-sm;
      transition: all 0.3s ease;
      border: 2px solid $gray-200;

      @include mobile {
        margin-bottom: 0;
        margin-right: $spacing-md;
        width: 40px;
        height: 40px;
        font-size: 18px;
      }
    }

    .step-label {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: $text-secondary;
      margin-bottom: $spacing-xs;
      transition: color 0.3s ease;

      @include mobile {
        font-size: $font-size-md;
        margin-bottom: $spacing-xs;
      }
    }

    .step-time {
      font-size: $font-size-xs;
      color: $text-tertiary;

      @include mobile {
        font-size: $font-size-sm;
      }
    }

    // 已完成状态
    &.completed {
      .step-icon {
        background: $success-color;
        color: $white;
        border-color: $success-color;
      }

      .step-label {
        color: $success-color;
        font-weight: $font-weight-semibold;
      }

      .step-time {
        color: $success-color;
      }
    }

    // 当前状态
    &.current {
      .step-icon {
        background: $primary-color;
        color: $white;
        border-color: $primary-color;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
      }

      .step-label {
        color: $primary-color;
        font-weight: $font-weight-bold;
      }

      .step-time {
        color: $primary-color;
      }
    }

    // 取消/超时/拒绝状态
    &.cancelled {
      .step-icon {
        background: $error-color;
        color: $white;
        border-color: $error-color;
      }

      .step-label {
        color: $error-color;
        font-weight: $font-weight-semibold;
      }

      .step-time {
        color: $error-color;
      }
    }

    // 退款流程状态
    &.refund {
      .step-icon {
        border-color: $warning-color;
      }

      &.completed .step-icon {
        background: $warning-color;
        border-color: $warning-color;
      }

      &.current .step-icon {
        background: $warning-color;
        border-color: $warning-color;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
      }

      &.completed .step-label,
      &.current .step-label {
        color: $warning-color;
      }

      &.completed .step-time,
      &.current .step-time {
        color: $warning-color;
      }
    }

    // 连接线
    .step-connector {
      position: absolute;
      top: 24px;
      left: calc(50% + 24px);
      right: calc(-50% + 24px);
      height: 2px;
      background: $gray-200;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;

      @include mobile {
        display: none;
      }

      .connector-line {
        width: 100%;
        height: 2px;
        background: inherit;
        transition: background 0.3s ease;
      }

      .connector-text {
        position: absolute;
        top: 10px;
        background: $white;
        padding: $spacing-xs $spacing-sm;
        font-size: $font-size-xs;
        color: $text-tertiary;
        border-radius: $border-radius-sm;
        white-space: nowrap;
        border: 1px solid $border-light;
      }

      &.active {
        .connector-line {
          background: $success-color;
        }
      }

      &.cancelled {
        .connector-line {
          background: $error-color;
        }
      }
    }

    // 最后一个步骤不显示连接线
    &:last-child .step-connector {
      display: none;
    }
  }
}
</style>