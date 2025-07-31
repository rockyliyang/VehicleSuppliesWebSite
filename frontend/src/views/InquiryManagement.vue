<template>
  <div class="inquiry-management-page">
    <PageBanner :title="$t('inquiry.management.title') || '询价单管理'" />

    <!-- Navigation Menu -->
    <NavigationMenu :breadcrumb-items="breadcrumbItems" />

    <div class="inquiry-management-container">
      <!-- Inquiry Panel -->
      <InquiryPanel :cart-items="[]" :inquired-product-ids="inquiredProductIds"
        @update-inquired-products="updateInquiredProductIds" @inquiry-created="handleInquiryCreated"
        ref="inquiryPanel" />
    </div>
  </div>
</template>

<script>
import PageBanner from '@/components/common/PageBanner.vue';
import NavigationMenu from '@/components/common/NavigationMenu.vue';
import InquiryPanel from '@/components/common/InquiryPanel.vue';

export default {
  name: 'InquiryManagement',
  components: {
    PageBanner,
    NavigationMenu,
    InquiryPanel
  },
  data() {
    return {
      // Inquiry system data
      inquiredProductIds: new Set()
    };
  },
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('inquiry.management.title') || '询价单管理' }
      ];
    }
  },
  created() {
    // 检查用户是否已登录
    if (!this.$store.getters.isLoggedIn) {
      this.$router.push('/login?redirect=/inquiry-management');
      return;
    }
  },
  methods: {
    // Method to update inquired product IDs from InquiryPanel
    updateInquiredProductIds(inquiredIds) {
      this.inquiredProductIds = new Set(inquiredIds);
    },
    
    // Method to handle inquiry creation from InquiryPanel
    handleInquiryCreated(inquiryId) {
      console.log('新询价单已创建:', inquiryId);
    }
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_variables.scss';
@import '@/assets/styles/_mixins.scss';

.inquiry-management-page {
  min-height: 100vh;
  background-color: $gray-100;
}

.inquiry-management-container {
  @include container;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @include tablet {
    grid-template-columns: 2fr 1fr;
    gap: 32px;
  }
}
</style>