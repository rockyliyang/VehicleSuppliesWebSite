<template>
  <div class="logistics-companies">
    <div class="page-header">
      <h1>Logistics Companies Management</h1>
      <button @click="showCreateModal" class="btn btn-primary">
        <i class="fas fa-plus"></i> Add Company
      </button>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <div class="filter-row">
        <div class="filter-group">
          <label>Status:</label>
          <select v-model="filters.status" @change="loadCompanies">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Search:</label>
          <input 
            type="text" 
            v-model="filters.search" 
            @input="debounceSearch"
            placeholder="Company name..."
          >
        </div>
      </div>
    </div>

    <!-- 公司列表 -->
    <div class="companies-table-container">
      <table class="companies-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Company Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="company in companies" :key="company.id">
            <td>{{ company.id }}</td>
            <td>{{ company.name }}</td>
            <td>{{ company.description || 'No description' }}</td>
            <td>
              <span :class="'status-badge status-' + company.status">
                {{ formatStatus(company.status) }}
              </span>
            </td>
            <td>{{ formatDate(company.created_at) }}</td>
            <td>
              <button @click="editCompany(company)" class="btn btn-primary btn-sm">
                Edit
              </button>
              <button @click="deleteCompany(company)" class="btn btn-danger btn-sm">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        @click="changePage(currentPage - 1)" 
        :disabled="currentPage <= 1"
        class="btn btn-outline">
        Previous
      </button>
      
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      
      <button 
        @click="changePage(currentPage + 1)" 
        :disabled="currentPage >= totalPages"
        class="btn btn-outline">
        Next
      </button>
    </div>

    <!-- 创建/编辑模态框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Company' : 'Add New Company' }}</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveCompany">
            <div class="form-group">
              <label>Company Name: <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="companyForm.name" 
                required
                placeholder="Enter company name"
              >
            </div>

            <div class="form-group">
              <label>Description:</label>
              <textarea 
                v-model="companyForm.description" 
                placeholder="Enter company description"
                rows="4"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Status:</label>
              <select v-model="companyForm.status" required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" @click="closeModal" class="btn btn-outline">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>Loading companies...</p>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && companies.length === 0" class="empty-state">
      <p>No logistics companies found.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LogisticsCompanies',
  data() {
    return {
      companies: [],
      loading: false,
      isSaving: false,
      showModal: false,
      isEditing: false,
      currentPage: 1,
      totalPages: 1,
      pageSize: 20,
      searchTimeout: null,
      filters: {
        status: '',
        search: ''
      },
      companyForm: {
        id: null,
        name: '',
        description: '',
        status: 'active'
      }
    }
  },
  mounted() {
    this.loadCompanies()
  },
  methods: {
    async loadCompanies() {
      this.loading = true
      try {
        const params = new URLSearchParams({
          page: this.currentPage,
          limit: this.pageSize,
          ...this.filters
        })

        const response = await this.$api.getWithErrorHandler(`/order-management/admin/logistics-companies?${params}`, {
          fallbackKey: 'logistics.error.fetchCompaniesFailed'
        })

        if (response.success) {
          this.companies = response.data.companies
          this.totalPages = response.data.pagination.pages
        }
      } catch (error) {
        console.error('Error loading companies:', error)
      } finally {
        this.loading = false
      }
    },

    showCreateModal() {
      this.isEditing = false
      this.companyForm = {
        id: null,
        name: '',
        description: '',
        status: 'active'
      }
      this.showModal = true
    },

    editCompany(company) {
      this.isEditing = true
      this.companyForm = {
        id: company.id,
        name: company.name,
        description: company.description || '',
        status: company.status
      }
      this.showModal = true
    },

    async saveCompany() {
      this.isSaving = true
      try {
        const companyData = {
          name: this.companyForm.name,
          description: this.companyForm.description,
          status: this.companyForm.status
        }

        let response
        if (this.isEditing) {
          response = await this.$api.putWithErrorHandler(`/order-management/admin/logistics-companies/${this.companyForm.id}`, companyData, {
            fallbackKey: 'logistics.error.updateFailed'
          })
        } else {
          response = await this.$api.postWithErrorHandler('/order-management/admin/logistics-companies', companyData, {
            fallbackKey: 'logistics.error.createFailed'
          })
        }

        if (response.success) {
          this.closeModal()
          this.loadCompanies()
          this.$message.success(this.$t(response.message))
        }
      } catch (error) {
        console.error('Error saving company:', error)
      } finally {
        this.isSaving = false
      }
    },

    async deleteCompany(company) {
      if (!confirm(`Are you sure you want to delete "${company.name}"?`)) {
        return
      }

      try {
        const response = await this.$api.deleteWithErrorHandler(`/order-management/admin/logistics-companies/${company.id}`, {
          fallbackKey: 'logistics.error.deleteFailed'
        })

        if (response.success) {
          this.loadCompanies()
          this.$message.success(this.$t(response.message))
        }
      } catch (error) {
        console.error('Error deleting company:', error)
      }
    },

    closeModal() {
      this.showModal = false
      this.isEditing = false
      this.companyForm = {
        id: null,
        name: '',
        description: '',
        status: 'active'
      }
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadCompanies()
      }
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1
        this.loadCompanies()
      }, 500)
    },

    formatStatus(status) {
      const statusMap = {
        active: 'Active',
        inactive: 'Inactive'
      }
      return statusMap[status] || status
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.logistics-companies {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #333;
  margin: 0;
}

.filters {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: 500;
  color: #555;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.companies-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.companies-table {
  width: 100%;
  border-collapse: collapse;
}

.companies-table th,
.companies-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.companies-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-active { 
  background: #d1e7dd; 
  color: #0f5132; 
}

.status-inactive { 
  background: #e2e3e5; 
  color: #41464b; 
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 5px;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-outline {
  background: transparent;
  border: 1px solid #ddd;
  color: #333;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:hover {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.page-info {
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #dc3545;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .companies-table {
    font-size: 14px;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style>