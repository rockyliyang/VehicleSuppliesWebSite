<template>
  <div class="product-review">
    <!-- 评论统计 -->
    <div class="review-stats" v-if="stats">
      <h3>用户评价</h3>
      <div class="stats-summary">
        <div class="average-rating">
          <span class="rating-score">{{ stats.average_rating || 0 }}</span>
          <div class="stars">
            <span v-for="i in 5" :key="i" :class="['star', i <= Math.round(stats.average_rating) ? 'filled' : '']">
              ★
            </span>
          </div>
          <span class="total-reviews">({{ stats.total_reviews }}条评价)</span>
        </div>

        <div class="rating-breakdown">
          <div v-for="i in 5" :key="i" class="rating-row">
            <span>{{ 6-i }}星</span>
            <div class="progress-bar">
              <div class="progress" :style="{ width: getPercentage(6-i) + '%' }"></div>
            </div>
            <span>{{ stats[`rating_${6-i}_count`] || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 写评论按钮 -->
    <div class="write-review-section" v-if="isLoggedIn && !userReview">
      <button @click="showReviewForm = true" class="btn-primary">
        写评价
      </button>
    </div>

    <!-- 评论表单 -->
    <div v-if="showReviewForm" class="review-form">
      <h4>写评价</h4>
      <form @submit.prevent="submitReview">
        <div class="rating-input">
          <label>评分：</label>
          <div class="star-rating">
            <span v-for="i in 5" :key="i" @click="newReview.rating = i"
              :class="['star', i <= newReview.rating ? 'active' : '']">
              ★
            </span>
          </div>
        </div>

        <div class="content-input">
          <label>评论内容：</label>
          <textarea v-model="newReview.content" placeholder="分享您的使用体验..." maxlength="1000" rows="4"></textarea>
          <small>{{ newReview.content.length }}/1000</small>
        </div>

        <div class="image-upload">
          <label>上传图片（最多5张）：</label>
          <input type="file" @change="handleImageSelect" multiple accept="image/*" ref="imageInput"
            :disabled="uploadedImages.length + selectedImages.length >= 5">

          <!-- 已上传的图片 -->
          <div v-if="uploadedImages.length > 0" class="uploaded-images">
            <h5>已上传的图片：</h5>
            <div class="image-preview">
              <div v-for="image in uploadedImages" :key="image.id" class="image-item uploaded">
                <img :src="image.image_url" alt="已上传">
                <span class="upload-status">✓</span>
              </div>
            </div>
          </div>

          <!-- 待上传的图片预览 -->
          <div v-if="selectedImages.length > 0" class="image-preview">
            <h5>待上传的图片：</h5>
            <div v-for="(image, index) in selectedImages" :key="index" class="image-item">
              <img :src="image.preview" alt="预览">
              <button type="button" @click="removeImage(index)">×</button>
            </div>
          </div>

          <small>已上传：{{ uploadedImages.length }}张，待上传：{{ selectedImages.length }}张</small>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="!newReview.rating || submitting" class="btn-primary">
            {{ submitting ? '提交中...' : '提交评价' }}
          </button>
          <button type="button" @click="cancelReview" class="btn-secondary">
            取消
          </button>
        </div>
      </form>
    </div>

    <!-- 用户自己的评论 -->
    <div v-if="userReview" class="user-review">
      <h4>我的评价</h4>
      <div class="review-item">
        <div class="review-header">
          <div class="stars">
            <span v-for="i in 5" :key="i" :class="['star', i <= userReview.rating ? 'filled' : '']">
              ★
            </span>
          </div>
          <span class="review-date">{{ formatDate(userReview.created_at) }}</span>
          <span :class="['status', userReview.status]">
            {{ getStatusText(userReview.status) }}
          </span>
        </div>
        <p class="review-content">{{ userReview.review_content }}</p>
        <div v-if="userReview.images && userReview.images.length > 0" class="review-images">
          <img v-for="image in userReview.images" :key="image.id" :src="image.image_url"
            @click="showImageModal(image.image_url)" alt="评论图片">
        </div>
        <div v-if="userReview.admin_reply" class="admin-reply">
          <strong>商家回复：</strong>
          <p>{{ userReview.admin_reply }}</p>
          <small>{{ formatDate(userReview.admin_reply_at) }}</small>
        </div>
        <div class="review-actions">
          <button @click="editReview" class="btn-link">编辑</button>
          <button @click="deleteReview" class="btn-link text-danger">删除</button>
        </div>
      </div>
    </div>

    <!-- 其他用户评论列表 -->
    <div class="reviews-list">
      <h4>全部评价 ({{ reviews.length }})</h4>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="reviews.length === 0" class="no-reviews">
        暂无评价
      </div>
      <div v-else>
        <div v-for="review in reviews" :key="review.id" class="review-item">
          <div class="review-header">
            <span class="username">{{ review.is_anonymous ? '匿名用户' : review.username }}</span>
            <div class="stars">
              <span v-for="i in 5" :key="i" :class="['star', i <= review.rating ? 'filled' : '']">
                ★
              </span>
            </div>
            <span class="review-date">{{ formatDate(review.created_at) }}</span>
          </div>
          <p class="review-content">{{ review.review_content }}</p>
          <div v-if="review.images && review.images.length > 0" class="review-images">
            <img v-for="image in review.images" :key="image.id" :src="image.image_url"
              @click="showImageModal(image.image_url)" alt="评论图片">
          </div>
          <div v-if="review.admin_reply" class="admin-reply">
            <strong>商家回复：</strong>
            <p>{{ review.admin_reply }}</p>
            <small>{{ formatDate(review.admin_reply_at) }}</small>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button @click="loadPage(currentPage - 1)" :disabled="currentPage <= 1" class="btn-secondary">
            上一页
          </button>
          <span>{{ currentPage }} / {{ totalPages }}</span>
          <button @click="loadPage(currentPage + 1)" :disabled="currentPage >= totalPages" class="btn-secondary">
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 图片模态框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <img :src="modalImage" alt="查看大图">
        <button @click="closeModal" class="modal-close">×</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductReview',
  props: {
    productId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      stats: null,
      reviews: [],
      userReview: null,
      loading: false,
      submitting: false,
      showReviewForm: false,
      showModal: false,
      modalImage: '',
      currentPage: 1,
      totalPages: 1,
      newReview: {
        rating: 0,
        content: ''
      },
      selectedImages: [],
      sessionId: null,
      uploadedImages: [] // 存储已上传的图片信息
    }
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters.isAuthenticated;
    }
  },
  mounted() {
    this.generateSessionId();
    this.loadReviewStats();
    this.loadReviews();
    if (this.isLoggedIn) {
      this.loadUserReview();
    }
  },
  methods: {
    async loadReviewStats() {
      try {
        const response = await this.$http.get(`/product-reviews/stats?product_id=${this.productId}`);
        if (response.success) {
          this.stats = response.data;
        }
      } catch (error) {
        console.error('加载评论统计失败:', error);
      }
    },

    async loadReviews(page = 1) {
      this.loading = true;
      try {
        const response = await this.$http.get(`/product-reviews/product/${this.productId}?page=${page}&limit=10`);
        if (response.success) {
          this.reviews = response.data.reviews;
          this.currentPage = response.data.pagination.page;
          this.totalPages = response.data.pagination.totalPages;
        }
      } catch (error) {
        console.error('加载评论列表失败:', error);
      } finally {
        this.loading = false;
      }
    },

    async loadUserReview() {
      try {
        const response = await this.$http.get(`/product-reviews/product/${this.productId}?user_only=true`);
        if (response.data.success && response.data.reviews.length > 0) {
          this.userReview = response.data.reviews[0];
        }
      } catch (error) {
        console.error('加载用户评论失败:', error);
      }
    },

    async submitReview() {
      if (!this.newReview.rating) {
        this.$message.error('请选择评分');
        return;
      }

      this.submitting = true;
      try {
        // 创建评论，包含session_id以关联预上传的图片
        const response = await this.$http.post('/product-reviews', {
          product_id: this.productId,
          rating: this.newReview.rating,
          review_content: this.newReview.content,
          session_id: this.sessionId // 关联预上传的图片
        });

        if (response.data.success) {
          this.$message.success('评价提交成功，等待审核');
          this.cancelReview();
          this.loadReviewStats();
          this.loadUserReview();
          // 重新生成session_id用于下次评论
          this.generateSessionId();
        }
      } catch (error) {
        console.error('提交评价失败:', error);
        this.$message.error(error.response?.data?.message || '提交失败');
      } finally {
        this.submitting = false;
      }
    },

    async uploadImages() {
      if (this.selectedImages.length === 0) return;

      const formData = new FormData();
      formData.append('session_id', this.sessionId);
      
      this.selectedImages.forEach(image => {
        formData.append('images', image.file);
      });

      try {
        const response = await this.$http.post('/product-review-images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.success) {
          // 保存已上传的图片信息
          this.uploadedImages = response.data.images;
          this.$message.success(`成功上传 ${response.data.total_uploaded} 张图片`);
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        this.$message.error('图片上传失败');
      }
    },

    async handleImageSelect(event) {
      const files = Array.from(event.target.files);
      
      if (files.length + this.selectedImages.length + this.uploadedImages.length > 5) {
        this.$message.error('最多只能上传5张图片');
        return;
      }

      // 验证文件大小和格式
      const validFiles = [];
      files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          this.$message.error(`图片 ${file.name} 超过5MB限制`);
          return;
        }
        validFiles.push(file);
      });

      if (validFiles.length === 0) return;

      // 添加到选中列表并生成预览
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.selectedImages.push({
            file: file,
            preview: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });

      // 立即上传图片
      setTimeout(() => {
        this.uploadImages();
      }, 100); // 等待预览生成完成
    },

    removeImage(index) {
      this.selectedImages.splice(index, 1);
    },

    generateSessionId() {
      // 生成唯一的session ID
      this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    cancelReview() {
      this.showReviewForm = false;
      this.newReview = { rating: 0, content: '' };
      this.selectedImages = [];
      this.uploadedImages = [];
      this.$refs.imageInput.value = '';
      // 重新生成session_id
      this.generateSessionId();
    },

    async deleteReview() {
      if (!confirm('确定要删除这条评价吗？')) {
        return;
      }

      try {
        const response = await this.$http.delete(`/product-reviews/${this.userReview.id}`);
        if (response.data.success) {
          this.$message.success('评价已删除');
          this.userReview = null;
          this.loadReviewStats();
        }
      } catch (error) {
        console.error('删除评价失败:', error);
        this.$message.error('删除失败');
      }
    },

    editReview() {
      this.newReview.rating = this.userReview.rating;
      this.newReview.content = this.userReview.review_content;
      this.showReviewForm = true;
    },

    loadPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.loadReviews(page);
      }
    },

    showImageModal(imageUrl) {
      this.modalImage = imageUrl;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.modalImage = '';
    },

    getPercentage(rating) {
      if (!this.stats || !this.stats.total_reviews) return 0;
      const count = this.stats[`rating_${rating}_count`] || 0;
      return (count / this.stats.total_reviews) * 100;
    },

    getStatusText(status) {
      const statusMap = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已拒绝'
      };
      return statusMap[status] || status;
    },

    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('zh-CN');
    }
  }
}
</script>

<style scoped>
.product-review {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.review-stats {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats-summary {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.average-rating {
  text-align: center;
}

.rating-score {
  font-size: 2.5em;
  font-weight: bold;
  color: #ff6b35;
}

.stars {
  margin: 10px 0;
}

.star {
  font-size: 1.2em;
  color: #ddd;
  cursor: pointer;
}

.star.filled,
.star.active {
  color: #ff6b35;
}

.rating-breakdown {
  flex: 1;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #ff6b35;
  transition: width 0.3s;
}

.review-form {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.rating-input,
.content-input,
.image-upload {
  margin-bottom: 15px;
}

.star-rating .star {
  font-size: 1.5em;
  margin-right: 5px;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.image-upload {
  margin-bottom: 15px;
}

.image-upload input[type="file"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.uploaded-images {
  margin-top: 15px;
}

.uploaded-images h5 {
  margin: 0 0 10px 0;
  color: #28a745;
  font-size: 0.9em;
}

.image-preview {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.image-preview h5 {
  width: 100%;
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9em;
}

.image-item {
  position: relative;
  width: 80px;
  height: 80px;
  border: 2px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.image-item.uploaded {
  border-color: #28a745;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-item button {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-status {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: #28a745;
  color: white;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload small {
  display: block;
  margin-top: 10px;
  color: #666;
  font-size: 0.85em;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-link {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  text-decoration: underline;
}

.text-danger {
  color: #dc3545 !important;
}

.review-item {
  border-bottom: 1px solid #eee;
  padding: 15px 0;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.username {
  font-weight: bold;
}

.review-date {
  color: #666;
  font-size: 0.9em;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.status.pending {
  background: #fff3cd;
  color: #856404;
}

.status.approved {
  background: #d4edda;
  color: #155724;
}

.status.rejected {
  background: #f8d7da;
  color: #721c24;
}

.review-images {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

.review-images img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.admin-reply {
  background: #f0f8ff;
  padding: 10px;
  border-left: 3px solid #007bff;
  margin-top: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.modal-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.loading,
.no-reviews {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>