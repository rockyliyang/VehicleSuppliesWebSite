<template>
  <div class="logistics-companies">
    <div class="page-header">
      <h1>{{ $t('logistics.management.title') || '物流公司管理' }}</h1>
      <p>{{ $t('logistics.management.description') || '管理物流公司信息，添加、编辑和删除物流公司' }}</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item :label="$t('logistics.filter.status') || '状态'">
          <el-select v-model="filters.status" :placeholder="$t('logistics.filter.status_placeholder') || '选择状态'"
            clearable style="width: 150px;" @change="loadCompanies">
            <el-option value="active" :label="$t('logistics.status.active') || '启用'" />
            <el-option value="inactive" :label="$t('logistics.status.inactive') || '禁用'" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('logistics.filter.search') || '搜索'">
          <el-input v-model="filters.search" :placeholder="$t('logistics.filter.search_placeholder') || '公司名称...'"
            @input="debounceSearch" style="width: 200px;" clearable />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">{{ $t('common.reset') || '重置' }}</el-button>
          <el-button type="success" @click="loadCompanies" :loading="loading">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
          <el-button type="primary" @click="showCreateModal">
            <el-icon>
              <Plus />
            </el-icon>
            {{ $t('logistics.action.add') || '添加公司' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 公司列表 -->
    <el-card class="companies-list-card">
      <el-table v-loading="loading" :data="companies" stripe>
        <el-table-column prop="id" :label="$t('logistics.table.id') || 'ID'" width="80" />
        <el-table-column :label="$t('logistics.table.is_default') || '默认'" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_default" type="success">{{ $t('logistics.status.default') || '默认' }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" :label="$t('logistics.table.name') || '公司名称'" min-width="150" />
        <el-table-column :label="$t('logistics.table.description') || '描述'" min-width="200">
          <template #default="{ row }">
            {{ row.description || $t('logistics.table.no_description') || '无描述' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.contact_phone') || '联系电话'" width="150">
          <template #default="{ row }">
            {{ row.contact_phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.contact_email') || '联系邮箱'" width="180">
          <template #default="{ row }">
            {{ row.contact_email || '-' }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.website') || '官网'" width="150">
          <template #default="{ row }">
            <a v-if="row.website" :href="row.website" target="_blank" class="website-link">
              {{ row.website }}
            </a>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.status') || '状态'" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.is_active)">{{ formatStatus(row.is_active) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('logistics.table.created_at') || '创建时间'" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('logistics.table.actions') || '操作'" width="360" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editCompany(row)">
              {{ $t('logistics.action.edit') || '编辑' }}
            </el-button>
            <el-button type="success" size="small" @click="openShippingFeeModal(row)">
              {{ $t('logistics.action.manage_shipping_fee') || '价格范围' }}
            </el-button>
            <el-button v-if="row.is_active && !row.is_default" type="warning" size="small" @click="setDefaultCompany(row)">
              {{ $t('logistics.action.set_default') || '设为默认' }}
            </el-button>
            <el-button type="danger" size="small" @click="deleteCompany(row)">
              {{ $t('logistics.action.delete') || '删除' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
          :total="totalRecords" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="showModal"
      :title="isEditing ? ($t('logistics.dialog.edit_title') || '编辑公司') : ($t('logistics.dialog.add_title') || '添加新公司')"
      width="500px" :close-on-click-modal="false">
      <el-form :model="companyForm" label-width="100px" @submit.prevent="saveCompany">
        <el-form-item :label="$t('logistics.form.name') || '公司名称'" required>
          <el-input v-model="companyForm.name" :placeholder="$t('logistics.form.name_placeholder') || '请输入公司名称'"
            required />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.description') || '描述'">
          <el-input v-model="companyForm.description" type="textarea"
            :placeholder="$t('logistics.form.description_placeholder') || '请输入公司描述'" :rows="4" />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.contact_phone') || '联系电话'">
          <el-input v-model="companyForm.contact_phone"
            :placeholder="$t('logistics.form.contact_phone_placeholder') || '请输入联系电话'" />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.contact_email') || '联系邮箱'">
          <el-input v-model="companyForm.contact_email"
            :placeholder="$t('logistics.form.contact_email_placeholder') || '请输入联系邮箱'" />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.website') || '官网'">
          <el-input v-model="companyForm.website"
            :placeholder="$t('logistics.form.website_placeholder') || '请输入官网地址'" />
        </el-form-item>

        <el-form-item :label="$t('logistics.form.status') || '状态'" required>
          <el-select v-model="companyForm.is_active" style="width: 100%">
            <el-option :value="true" :label="$t('logistics.status.active') || '启用'" />
            <el-option :value="false" :label="$t('logistics.status.inactive') || '禁用'" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeModal">
          {{ $t('common.cancel') || '取消' }}
        </el-button>
        <el-button type="primary" @click="saveCompany" :loading="isSaving">
          {{ isSaving ? ($t('common.saving') || '保存中...') : ($t('common.save') || '保存') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 空状态 -->
    <el-empty v-if="!loading && companies.length === 0"
      :description="$t('logistics.empty.description') || '暂无物流公司数据'" />

    <!-- 运费范围管理对话框 -->
    <el-dialog v-model="showShippingFeeModal" :title="$t('logistics.shipping_fee.dialog_title') || '运费范围管理'" width="80%"
      :close-on-click-modal="false" class="shipping-fee-dialog">
      <div class="shipping-fee-content">
        <!-- 公司信息 -->
        <div class="company-info">
          <h3>{{ selectedCompany?.name }}</h3>
          <p>{{ $t('logistics.shipping_fee.company_description') || '管理该物流公司的运费范围设置' }}</p>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="primary" @click="showAddShippingFeeModal">
            <el-icon>
              <Plus />
            </el-icon>
            {{ $t('logistics.shipping_fee.add_range') || '添加运费范围' }}
          </el-button>
          <el-button @click="loadShippingFeeRanges" :loading="loadingShippingFee">
            <el-icon>
              <Refresh />
            </el-icon>
            {{ $t('common.refresh') || '刷新' }}
          </el-button>
        </div>

        <!-- 分组方式选择 -->
        <div class="grouping-selector">
          <el-radio-group v-model="groupingMode" @change="handleGroupingModeChange">
            <el-radio-button label="default">{{ $t('logistics.shipping_fee.default_group') || '默认分组'
              }}</el-radio-button>
            <el-radio-button label="tag">{{ $t('logistics.shipping_fee.tag_group') || '按标签分组' }}</el-radio-button>
            <el-radio-button label="country">{{ $t('logistics.shipping_fee.country_group') || '按国家分组'
              }}</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 运费范围内容 -->
        <div class="shipping-fee-content-area">
          <!-- 默认分组 -->
          <div v-if="groupingMode === 'default'" class="default-group">
            <div class="group-header">
              <h4>{{ $t('logistics.shipping_fee.default_settings') || '默认运费设置' }}</h4>
              <p>{{ $t('logistics.shipping_fee.default_description') || '适用于所有未特别设置的情况' }}</p>
            </div>
            <div class="shipping-fee-table">
              <el-table v-loading="loadingShippingFee" :data="defaultShippingFeeRanges" stripe empty-text="暂无默认运费范围">
                <el-table-column :label="$t('logistics.shipping_fee.min_weight') || '最小重量(kg)'" width="120">
                  <template #default="{ row }">
                    {{ parseFloat(row.min_weight) }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('logistics.shipping_fee.max_weight') || '最大重量(kg)'" width="120">
                  <template #default="{ row }">
                    {{ row.max_weight ? parseFloat(row.max_weight) : ($t('logistics.shipping_fee.unlimited') || '无限制')
                    }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('logistics.shipping_fee.fee') || '运费'" width="100">
                  <template #default="{ row }">
                    ${{ parseFloat(row.fee).toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" :label="$t('logistics.shipping_fee.created_at') || '创建时间'"
                  width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column :label="$t('logistics.shipping_fee.actions') || '操作'" width="150">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="editShippingFeeRange(row)">
                      {{ $t('common.edit') || '编辑' }}
                    </el-button>
                    <el-button type="danger" size="small" @click="deleteShippingFeeRange(row)">
                      {{ $t('common.delete') || '删除' }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- 按标签分组 -->
          <div v-else-if="groupingMode === 'tag'" class="tag-group">
            <div class="group-header">
              <h4>{{ $t('logistics.shipping_fee.tag_settings') || '按标签运费设置' }}</h4>
              <p>{{ $t('logistics.shipping_fee.tag_description') || '为不同标签设置专门的运费规则' }}</p>
            </div>
            <el-tabs v-model="activeTagTab" @tab-click="handleTagTabClick">
              <el-tab-pane v-for="tag in tagsWithShippingFee" :key="tag.id" :label="tag.value" :name="String(tag.id)">
                <div class="shipping-fee-table">
                  <el-table v-loading="loadingShippingFee" :data="currentTagShippingFeeRanges" stripe
                    :empty-text="$t('logistics.shipping_fee.no_ranges_for_tag') || '该标签暂无运费范围'">
                    <el-table-column :label="$t('logistics.shipping_fee.min_weight') || '最小重量(kg)'" width="120">
                      <template #default="{ row }">
                        {{ parseFloat(row.min_weight) }}
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('logistics.shipping_fee.max_weight') || '最大重量(kg)'" width="120">
                      <template #default="{ row }">
                        {{ row.max_weight ? parseFloat(row.max_weight) : ($t('logistics.shipping_fee.unlimited') ||
                        '无限制') }}
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('logistics.shipping_fee.fee') || '运费'" width="100">
                      <template #default="{ row }">
                        ${{ parseFloat(row.fee).toFixed(2) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="created_at" :label="$t('logistics.shipping_fee.created_at') || '创建时间'"
                      width="180">
                      <template #default="{ row }">
                        {{ formatDate(row.created_at) }}
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('logistics.shipping_fee.actions') || '操作'" width="150">
                      <template #default="{ row }">
                        <el-button type="primary" size="small" @click="editShippingFeeRange(row)">
                          {{ $t('common.edit') || '编辑' }}
                        </el-button>
                        <el-button type="danger" size="small" @click="deleteShippingFeeRange(row)">
                          {{ $t('common.delete') || '删除' }}
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-tab-pane>
              <!-- 如果没有标签数据，显示提示 -->
              <el-empty v-if="tagsWithShippingFee.length === 0"
                :description="$t('logistics.shipping_fee.no_tag_data') || '暂无标签运费数据'" />
            </el-tabs>
          </div>

          <!-- 按国家分组 -->
          <div v-else-if="groupingMode === 'country'" class="country-group">
            <div class="group-header">
              <h4>{{ $t('logistics.shipping_fee.country_settings') || '按国家运费设置' }}</h4>
              <p>{{ $t('logistics.shipping_fee.country_description') || '为不同国家设置专门的运费规则' }}</p>
            </div>
            <el-tabs v-model="activeCountryTab" @tab-click="handleCountryTabClick">
              <el-tab-pane v-for="country in countriesWithShippingFee" :key="country.id" :label="country.name"
                :name="String(country.id)">
                <div class="shipping-fee-table">
                  <el-table v-loading="loadingShippingFee" :data="currentCountryShippingFeeRanges" stripe
                    :empty-text="$t('logistics.shipping_fee.no_ranges_for_country') || '该国家暂无运费范围'">
                    <el-table-column :label="$t('logistics.shipping_fee.min_weight') || '最小重量(kg)'" width="120">
                      <template #default="{ row }">
                        {{ parseFloat(row.min_weight) }}
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('logistics.shipping_fee.max_weight') || '最大重量(kg)'" width="120">
                      <template #default="{ row }">
                        {{ row.max_weight ? parseFloat(row.max_weight) : ($t('logistics.shipping_fee.unlimited') ||
                        '无限制') }}
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('logistics.shipping_fee.fee') || '运费'" width="100">
                      <template #default="{ row }">
                        ${{ parseFloat(row.fee).toFixed(2) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="created_at" :label="$t('logistics.shipping_fee.created_at') || '创建时间'"
                      width="180">
                      <template #default="{ row }">
                        {{ formatDate(row.created_at) }}
                      </template>
                    </el-table-column>
                    <el-table-column :label="$t('logistics.shipping_fee.actions') || '操作'" width="150">
                      <template #default="{ row }">
                        <el-button type="primary" size="small" @click="editShippingFeeRange(row)">
                          {{ $t('common.edit') || '编辑' }}
                        </el-button>
                        <el-button type="danger" size="small" @click="deleteShippingFeeRange(row)">
                          {{ $t('common.delete') || '删除' }}
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeShippingFeeModal">
          {{ $t('common.close') || '关闭' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑运费范围对话框 -->
    <el-dialog v-model="showShippingFeeFormModal"
      :title="isEditingShippingFee ? ($t('logistics.shipping_fee.edit_title') || '编辑运费范围') : ($t('logistics.shipping_fee.add_title') || '添加运费范围')"
      width="500px" :close-on-click-modal="false">
      <el-form :model="shippingFeeForm" label-width="120px" @submit.prevent="saveShippingFeeRange">
        <el-form-item :label="$t('logistics.shipping_fee.group_type') || '分组类型'">
          <el-radio-group v-model="shippingFeeForm.group_type" @change="handleGroupTypeChange">
            <el-radio label="default">{{ $t('logistics.shipping_fee.default_group') || '默认分组' }}</el-radio>
            <el-radio label="country">{{ $t('logistics.shipping_fee.country_group') || '按国家分组' }}</el-radio>
            <el-radio label="tag">{{ $t('logistics.shipping_fee.tag_group') || '按标签分组' }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="shippingFeeForm.group_type === 'country'"
          :label="$t('logistics.shipping_fee.country') || '国家'">
          <el-select v-model="shippingFeeForm.country_id"
            :placeholder="$t('logistics.shipping_fee.country_placeholder') || '选择国家'" clearable style="width: 100%"
            filterable>
            <el-option v-for="country in countries" :key="String(country.id)" :label="country.name"
              :value="String(country.id)" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="shippingFeeForm.group_type === 'tag'" :label="$t('logistics.shipping_fee.tag') || '标签'">
          <el-select v-model="shippingFeeForm.tags_id"
            :placeholder="$t('logistics.shipping_fee.tag_placeholder') || '选择标签'" clearable style="width: 100%"
            filterable>
            <el-option v-for="tag in countryTags" :key="String(tag.id)" :label="tag.value" :value="String(tag.id)" />
          </el-select>
        </el-form-item>

        <el-form-item :label="$t('logistics.shipping_fee.min_weight') || '最小重量(kg)'" required>
          <el-input-number v-model="shippingFeeForm.min_weight" :min="0" :precision="2" style="width: 100%"
            :placeholder="$t('logistics.shipping_fee.min_weight_placeholder') || '请输入最小重量'" />
        </el-form-item>

        <el-form-item :label="$t('logistics.shipping_fee.max_weight') || '最大重量(kg)'">
          <el-input-number v-model="shippingFeeForm.max_weight" :min="0" :precision="2" style="width: 100%"
            :placeholder="$t('logistics.shipping_fee.max_weight_placeholder') || '请输入最大重量（留空为无限制）'" />
        </el-form-item>

        <el-form-item :label="$t('logistics.shipping_fee.fee') || '运费'" required>
          <el-input-number v-model="shippingFeeForm.fee" :min="0" :precision="2" style="width: 100%"
            :placeholder="$t('logistics.shipping_fee.fee_placeholder') || '请输入运费'" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeShippingFeeFormModal">
          {{ $t('common.cancel') || '取消' }}
        </el-button>
        <el-button type="primary" @click="saveShippingFeeRange" :loading="isSavingShippingFee">
          {{ isSavingShippingFee ? ($t('common.saving') || '保存中...') : ($t('common.save') || '保存') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Refresh, Plus } from '@element-plus/icons-vue'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'LogisticsCompanies',
  components: {
    Refresh,
    Plus
  },
  data() {
    return {
      companies: [],
      loading: false,
      isSaving: false,
      showModal: false,
      isEditing: false,
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
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
        contact_phone: '',
        contact_email: '',
        website: '',
        is_active: true
      },
      // 运费范围管理相关数据
      showShippingFeeModal: false,
      showShippingFeeFormModal: false,
      selectedCompany: null,
      loadingShippingFee: false,
      isSavingShippingFee: false,
      isEditingShippingFee: false,
      activeCountryTab: 'default',
      shippingFeeRanges: [],
      // countries 现在从 store 获取，移除本地数据
      shippingFeeForm: {
        id: null,
        company_id: null,
        country_id: null,
        tags_id: null,
        group_type: 'default',
        min_weight: 0,
        max_weight: null,
        fee: 0
      },
      // 分组模式
      groupingMode: 'default',
      activeTagTab: '',
      countryTags: []
    }
  },
  computed: {
    ...mapState('countryState', ['countries']),
    
    // 默认运费范围（没有指定国家和标签的）
    defaultShippingFeeRanges() {
      // 确保数据是数组
      if (!Array.isArray(this.shippingFeeRanges)) {
        return []
      }
      return this.shippingFeeRanges.filter(range => !range.country_id && !range.tags_id)
    },

    // 有运费范围设置的国家列表
    countriesWithShippingFee() {
      // 确保数据是数组
      if (!Array.isArray(this.countries) || !Array.isArray(this.shippingFeeRanges)) {
        return []
      }
      const countryIds = [...new Set(this.shippingFeeRanges.filter(range => range.country_id).map(range => String(range.country_id)))]
      console.log('Country IDs from shipping fee ranges:', countryIds)
      console.log('Available countries:', this.countries)
      const filteredCountries = this.countries.filter(country => countryIds.includes(String(country.id)))
      console.log('Filtered countries with shipping fee:', filteredCountries)
      return filteredCountries
    },

    // 有运费范围设置的标签列表
    tagsWithShippingFee() {
      if (!Array.isArray(this.countryTags) || !Array.isArray(this.shippingFeeRanges)) {
        console.log('tagsWithShippingFee: Invalid data types', {
          countryTags: this.countryTags,
          shippingFeeRanges: this.shippingFeeRanges
        })
        return []
      }
      const rangesWithTags = this.shippingFeeRanges.filter(range => range.tags_id)
      console.log('Shipping fee ranges with tags_id:', rangesWithTags)
      const tagIds = [...new Set(rangesWithTags.map(range => String(range.tags_id)))]
      console.log('Unique tag IDs from shipping fee ranges:', tagIds)
      const filteredTags = this.countryTags.filter(tag => tagIds.includes(String(tag.id)))
      console.log('Filtered tags with shipping fee:', filteredTags)
      return filteredTags
    },

    // 当前选中国家的运费范围
    currentCountryShippingFeeRanges() {
      if (!this.activeCountryTab || !Array.isArray(this.shippingFeeRanges)) {
        console.log('No active country tab or shippingFeeRanges not array:', this.activeCountryTab, this.shippingFeeRanges)
        return []
      }
      const filtered = this.shippingFeeRanges.filter(range => String(range.country_id) === String(this.activeCountryTab))
      console.log('currentCountryShippingFeeRanges for tab', this.activeCountryTab, ':', filtered)
      return filtered
    },

    // 当前选中标签的运费范围
    currentTagShippingFeeRanges() {
      if (!this.activeTagTab || !Array.isArray(this.shippingFeeRanges)) {
        console.log('No active tag tab or shippingFeeRanges not array:', this.activeTagTab, this.shippingFeeRanges)
        return []
      }
      const filtered = this.shippingFeeRanges.filter(range => String(range.tags_id) === String(this.activeTagTab))
      console.log('currentTagShippingFeeRanges for tab', this.activeTagTab, ':', filtered)
      return filtered
    }
  },
  mounted() {
    this.loadCompanies()
    this.loadCountries()
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

        const response = await this.$api.getWithErrorHandler(`/admin/logistics/companies?${params}`, {
          fallbackKey: 'logistics.error.fetchCompaniesFailed'
        })

        if (response.success) {
          this.companies = response.data.companies
          this.totalPages = response.data.pagination.pages
          this.totalRecords = response.data.pagination.total
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
        contact_phone: '',
        contact_email: '',
        website: '',
        is_active: true
      }
      this.showModal = true
    },

    editCompany(company) {
      this.isEditing = true
      this.companyForm = {
        id: company.id,
        name: company.name,
        description: company.description || '',
        contact_phone: company.contact_phone || '',
        contact_email: company.contact_email || '',
        website: company.website || '',
        is_active: company.is_active
      }
      this.showModal = true
    },

    async saveCompany() {
      this.isSaving = true
      try {
        const companyData = {
          name: this.companyForm.name,
          description: this.companyForm.description,
          contact_phone: this.companyForm.contact_phone,
          contact_email: this.companyForm.contact_email,
          website: this.companyForm.website,
          is_active: this.companyForm.is_active
        }

        let response
        if (this.isEditing) {
          response = await this.$api.putWithErrorHandler(`/admin/logistics/companies/${this.companyForm.id}`, companyData, {
            fallbackKey: 'logistics.error.updateFailed'
          })
        } else {
          response = await this.$api.postWithErrorHandler('/admin/logistics/companies', companyData, {
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
      try {
        await this.$confirm(
          this.$t('logistics.confirm.delete_message', { name: company.name }) || `确定要删除"${company.name}"吗？`,
          this.$t('logistics.confirm.delete_title') || '确认删除',
          {
            confirmButtonText: this.$t('common.confirm') || '确定',
            cancelButtonText: this.$t('common.cancel') || '取消',
            type: 'warning'
          }
        )

        const response = await this.$api.deleteWithErrorHandler(`/admin/logistics/companies/${company.id}`, {
          fallbackKey: 'logistics.error.deleteFailed'
        })

        if (response.success) {
          this.loadCompanies()
          this.$message.success(this.$t(response.message))
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error deleting company:', error)
        }
      }
    },

    async setDefaultCompany(company) {
      try {
        await this.$confirm(
          this.$t('logistics.confirm.set_default_message', { name: company.name }) || `确定要将"${company.name}"设为默认物流公司吗？`,
          this.$t('logistics.confirm.set_default_title') || '确认设置默认',
          {
            confirmButtonText: this.$t('common.confirm') || '确定',
            cancelButtonText: this.$t('common.cancel') || '取消',
            type: 'warning'
          }
        )

        const response = await this.$api.putWithErrorHandler(`/admin/logistics/companies/${company.id}/set-default`, {}, {
          fallbackKey: 'logistics.error.setDefaultFailed'
        })

        if (response.success) {
          this.loadCompanies()
          this.$message.success(this.$t(response.message) || '设置默认物流公司成功')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error setting default company:', error)
        }
      }
    },

    closeModal() {
      this.showModal = false
      this.isEditing = false
      this.companyForm = {
        id: null,
        name: '',
        description: '',
        contact_phone: '',
        contact_email: '',
        website: '',
        is_active: true
      }
    },

    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        this.loadCompanies()
      }
    },

    handleSizeChange(newSize) {
      this.pageSize = newSize
      this.currentPage = 1
      this.loadCompanies()
    },

    handleCurrentChange(newPage) {
      this.currentPage = newPage
      this.loadCompanies()
    },

    resetFilters() {
      this.filters = {
        status: '',
        search: ''
      }
      this.currentPage = 1
      this.loadCompanies()
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1
        this.loadCompanies()
      }, 500)
    },

    formatStatus(isActive) {
      return isActive ? (this.$t('logistics.status.active') || '启用') : (this.$t('logistics.status.inactive') || '禁用')
    },

    getStatusType(isActive) {
      return isActive ? 'success' : 'info'
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },

    // 运费范围管理方法
    async openShippingFeeModal(company) {
      this.selectedCompany = company
      this.showShippingFeeModal = true
      console.log('Opening shipping fee modal for company:', company)
      await this.loadCountryTags()
      await this.loadShippingFeeRanges()
      // 设置默认的国家和标签标签页
      this.$nextTick(() => {
        console.log('Setting default tabs...')
        console.log('All shipping fee ranges:', this.shippingFeeRanges)
        console.log('All country tags:', this.countryTags)
        console.log('Countries with shipping fee:', this.countriesWithShippingFee)
        console.log('Tags with shipping fee:', this.tagsWithShippingFee)
        
        if (this.countriesWithShippingFee.length > 0) {
          this.activeCountryTab = String(this.countriesWithShippingFee[0].id)
          console.log('Set default activeCountryTab to:', this.activeCountryTab)
        }
        if (this.tagsWithShippingFee.length > 0) {
          this.activeTagTab = String(this.tagsWithShippingFee[0].id)
          console.log('Set default activeTagTab to:', this.activeTagTab)
          console.log('Ranges for default tag:', this.currentTagShippingFeeRanges)
        }
      })
    },

    ...mapActions('countryState', ['loadCountryStateData']),
    
    async loadCountries() {
      try {
        await this.loadCountryStateData()
      } catch (error) {
        console.error('Error loading countries:', error)
      }
    },

    async loadShippingFeeRanges() {
      if (!this.selectedCompany) return
      
      this.loadingShippingFee = true
      try {
        const response = await this.$api.getWithErrorHandler(`/admin/logistics/companies/${this.selectedCompany.id}/shipping-fee-ranges`, {
          fallbackKey: 'logistics.error.fetchShippingFeeRangesFailed'
        })
        if (response.success) {
          console.log('Raw shipping fee ranges from API:', response.data.ranges)
          this.shippingFeeRanges = response.data.ranges
          console.log('Stored shipping fee ranges:', this.shippingFeeRanges)
        }
      } catch (error) {
        console.error('Error loading shipping fee ranges:', error)
      } finally {
        this.loadingShippingFee = false
      }
    },

    getShippingFeeRangesByCountry(countryId) {
      // 确保数据是数组
      if (!Array.isArray(this.shippingFeeRanges)) {
        console.log('shippingFeeRanges is not an array:', this.shippingFeeRanges)
        return []
      }
      console.log('getShippingFeeRangesByCountry called with countryId:', countryId)
      console.log('All shipping fee ranges:', this.shippingFeeRanges)
      const filtered = this.shippingFeeRanges.filter(range => String(range.country_id) === String(countryId))
      console.log('Filtered ranges for country', countryId, ':', filtered)
      console.log('Filtered ranges length:', filtered.length)
      console.log('Filtered ranges type:', Array.isArray(filtered))
      // 确保返回的是纯数组，而不是响应式代理
      return [...filtered]
    },

    getShippingFeeRangesByTag(tagId) {
      // 确保数据是数组
      if (!Array.isArray(this.shippingFeeRanges)) {
        return []
      }
      return this.shippingFeeRanges.filter(range => String(range.tags_id) === String(tagId))
    },

    handleCountryTabClick(tab) {
      console.log('Country tab clicked:', tab)
      console.log('Tab name (countryId):', tab.name)
      console.log('Before update - activeCountryTab:', this.activeCountryTab)
      this.activeCountryTab = tab.name
      console.log('After update - activeCountryTab:', this.activeCountryTab)
      // 立即检查该国家的运费范围
      const ranges = this.getShippingFeeRangesByCountry(tab.name)
      console.log('Ranges for clicked country:', ranges)
      // 强制触发计算属性更新
      this.$nextTick(() => {
        console.log('Next tick - currentCountryShippingFeeRanges:', this.currentCountryShippingFeeRanges)
      })
    },

    handleTagTabClick(tab) {
      console.log('Tag tab clicked:', tab);
      console.log('Tab name (tagId):', tab.name);
      console.log('Before update - activeTagTab:', this.activeTagTab);
      this.activeTagTab = tab.name;
      console.log('After update - activeTagTab:', this.activeTagTab);
      // 立即检查该标签的运费范围
      const ranges = this.getShippingFeeRangesByTag(tab.name);
      console.log('Ranges for clicked tag:', ranges);
      // 强制触发计算属性更新
      this.$nextTick(() => {
        console.log('Next tick - currentTagShippingFeeRanges:', this.currentTagShippingFeeRanges);
      });
    },

    showAddShippingFeeModal() {
      this.isEditingShippingFee = false
      this.shippingFeeForm = {
        id: null,
        company_id: this.selectedCompany.id,
        country_id: null,
        tags_id: null,
        group_type: this.groupingMode,
        min_weight: 0,
        max_weight: null,
        fee: 0
      }
      this.showShippingFeeFormModal = true
    },

    editShippingFeeRange(range) {
      this.isEditingShippingFee = true
      this.shippingFeeForm = {
        id: range.id,
        company_id: range.logistics_companies_id,
        country_id: range.country_id ? String(range.country_id) : null,
        tags_id: range.tags_id ? String(range.tags_id) : null,
        group_type: range.tags_id ? 'tag' : (range.country_id ? 'country' : 'default'),
        min_weight: parseFloat(range.min_weight),
        max_weight: range.max_weight ? parseFloat(range.max_weight) : null,
        fee: parseFloat(range.fee)
      }
      this.showShippingFeeFormModal = true
    },

    async saveShippingFeeRange() {
      // 基本表单验证
      const minWeight = parseFloat(this.shippingFeeForm.min_weight)
      const maxWeight = this.shippingFeeForm.max_weight ? parseFloat(this.shippingFeeForm.max_weight) : null
      const fee = parseFloat(this.shippingFeeForm.fee)
      
      if (minWeight < 0) {
        this.$message.error(this.$t('logistics.validation.min_weight_negative') || '最小重量不能为负数')
        return
      }
      
      if (maxWeight !== null && maxWeight <= minWeight) {
        this.$message.error(this.$t('logistics.validation.max_weight_invalid') || '最大重量必须大于最小重量')
        return
      }
      
      if (fee < 0) {
        this.$message.error(this.$t('logistics.validation.fee_negative') || '运费不能为负数')
        return
      }

      this.isSavingShippingFee = true
      try {
        const rangeData = {
            logistics_companies_id: this.shippingFeeForm.company_id,
            country_id: this.shippingFeeForm.group_type === 'country' ? this.shippingFeeForm.country_id : null,
            tags_id: this.shippingFeeForm.group_type === 'tag' ? this.shippingFeeForm.tags_id : null,
            min_weight: this.shippingFeeForm.min_weight,
            max_weight: this.shippingFeeForm.max_weight,
            fee: this.shippingFeeForm.fee
          }

        let response
        if (this.isEditingShippingFee) {
          response = await this.$api.putWithErrorHandler(`/admin/logistics/companies/${this.shippingFeeForm.company_id}/shipping-fee-ranges/${this.shippingFeeForm.id}`, rangeData, {
            fallbackKey: 'logistics.error.updateShippingFeeRangeFailed'
          })
        } else {
          response = await this.$api.postWithErrorHandler(`/admin/logistics/companies/${this.shippingFeeForm.company_id}/shipping-fee-ranges`, rangeData, {
            fallbackKey: 'logistics.error.createShippingFeeRangeFailed'
          })
        }

        if (response.success) {
          this.closeShippingFeeFormModal()
          await this.loadShippingFeeRanges()
          this.$message.success(this.$t(response.message))
        }
      } catch (error) {
        console.error('Error saving shipping fee range:', error)
      } finally {
        this.isSavingShippingFee = false
      }
    },

    validateAllShippingFeeRanges() {
      if (!Array.isArray(this.shippingFeeRanges)) {
        return null // 没有数据时不需要校验
      }
      
      // 按三种分组方式分别校验：默认分组、按国家分组、按标签分组
      const rangesByGroup = {
        default: [], // 没有country_id也没有tags_id的默认分组
        countries: {}, // 按country_id分组
        tags: {} // 按tags_id分组
      }
      
      // 将运费范围按分组方式分类
      for (const range of this.shippingFeeRanges) {
        if (range.tags_id) {
          // 按标签分组
          const tagId = String(range.tags_id)
          if (!rangesByGroup.tags[tagId]) {
            rangesByGroup.tags[tagId] = []
          }
          rangesByGroup.tags[tagId].push(range)
        } else if (range.country_id) {
          // 按国家分组
          const countryId = String(range.country_id)
          if (!rangesByGroup.countries[countryId]) {
            rangesByGroup.countries[countryId] = []
          }
          rangesByGroup.countries[countryId].push(range)
        } else {
          // 默认分组（既没有country_id也没有tags_id）
          rangesByGroup.default.push(range)
        }
      }
      
      // 校验默认分组
      if (rangesByGroup.default.length > 0) {
        const validationError = this.validateGroupShippingFeeRanges(rangesByGroup.default, '默认分组')
        if (validationError) {
          return validationError
        }
      }
      
      // 校验按国家分组
      for (const [countryId, ranges] of Object.entries(rangesByGroup.countries)) {
        const countryName = "Group by Names: " + this.getCountryName(countryId)
        const validationError = this.validateGroupShippingFeeRanges(ranges, countryName)
        if (validationError) {
          return validationError
        }
      }
      
      // 校验按标签分组
      for (const [tagId, ranges] of Object.entries(rangesByGroup.tags)) {
        const tagName = "Group by Tags: " + this.getTagName(tagId)
        const validationError = this.validateGroupShippingFeeRanges(ranges, tagName)
        if (validationError) {
          return validationError
        }
      }
      
      return null // 所有校验通过
    },
    
    validateGroupShippingFeeRanges(ranges, groupName) {
      if (!ranges || ranges.length === 0) {
        return null // 没有范围时不需要校验
      }
      
      // 按最小重量排序（将字符串转换为数值）
      const sortedRanges = [...ranges].sort((a, b) => parseFloat(a.min_weight) - parseFloat(b.min_weight))
      
      // 检查第一个范围是否从0开始
      if (parseFloat(sortedRanges[0].min_weight) !== 0) {
        return `${groupName}: ${this.$t('logistics.validation.first_range_not_zero') || '第一个运费范围必须从0开始'}`
      }
      
      // 检查范围是否连续且无重叠
      for (let i = 0; i < sortedRanges.length - 1; i++) {
        const currentRange = sortedRanges[i]
        const nextRange = sortedRanges[i + 1]
        
        // 检查当前范围的最大重量是否等于下一个范围的最小重量
        if (currentRange.max_weight === null) {
          return `${groupName}: ${this.$t('logistics.validation.infinite_range_not_last') || '只有最后一个范围可以设置为无穷大'}`
        }
        
        if (parseFloat(currentRange.max_weight) !== parseFloat(nextRange.min_weight)) {
          return `${groupName}: ${this.$t('logistics.validation.range_not_continuous') || '运费范围必须连续，不能有间隙或重叠'}, ${currentRange.max_weight},${nextRange.min_weight}`
        }
      }
      
      // 检查最后一个范围是否到无穷大
      const lastRange = sortedRanges[sortedRanges.length - 1]
      if (lastRange.max_weight !== null) {
        return `${groupName}: ${this.$t('logistics.validation.last_range_not_infinite') || '最后一个运费范围的最大重量应为空（表示无穷大）'}`
      }
      
      return null // 该分组的范围校验通过
    },
    
    getCountryName(countryId) {
      const country = this.countries.find(c => String(c.id) === String(countryId))
      return country ? country.name : `国家ID: ${countryId}`
    },

    getTagName(tagId) {
      const tag = this.countryTags.find(t => String(t.id) === String(tagId))
      return tag ? tag.value : `标签ID: ${tagId}`
    },

    async deleteShippingFeeRange(range) {
      try {
        await this.$confirm(
          this.$t('logistics.confirm.delete_shipping_fee_range_message') || '确定要删除这个运费范围吗？',
          this.$t('logistics.confirm.delete_title') || '确认删除',
          {
            confirmButtonText: this.$t('common.confirm') || '确定',
            cancelButtonText: this.$t('common.cancel') || '取消',
            type: 'warning'
          }
        )

        const response = await this.$api.deleteWithErrorHandler(`/admin/logistics/companies/${range.logistics_companies_id}/shipping-fee-ranges/${range.id}`, {
          fallbackKey: 'logistics.error.deleteShippingFeeRangeFailed'
        })

        if (response.success) {
          await this.loadShippingFeeRanges()
          this.$message.success(this.$t(response.message))
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Error deleting shipping fee range:', error)
        }
      }
    },

    async closeShippingFeeModal() {
      // 在关闭对话框前进行整体校验
      const validationError = this.validateAllShippingFeeRanges()
      if (validationError) {
        this.$message.error(validationError)
        return // 阻止关闭对话框
      }
      
      this.showShippingFeeModal = false
      this.selectedCompany = null
      this.shippingFeeRanges = []
      this.activeCountryTab = 'default'
    },

    closeShippingFeeFormModal() {
      this.showShippingFeeFormModal = false
      this.isEditingShippingFee = false
      this.shippingFeeForm = {
        id: null,
        company_id: null,
        country_id: null,
        tags_id: null,
        group_type: 'default',
        min_weight: 0,
        max_weight: null,
        fee: 0
      }
    },

    // 新增分组相关方法
    handleGroupingModeChange() {
      // 分组模式改变时的处理逻辑
      console.log('Grouping mode changed to:', this.groupingMode)
      console.log('Current shipping fee ranges:', this.shippingFeeRanges)
      console.log('Current countries:', this.countries)
      console.log('Countries with shipping fee:', this.countriesWithShippingFee)
      if (this.groupingMode === 'tag') {
        this.loadCountryTags()
      }
    },

    handleGroupTypeChange() {
      // 重置相关字段
      this.shippingFeeForm.country_id = null
      this.shippingFeeForm.tags_id = null
    },

    async loadCountryTags() {
      try {
        const response = await this.$api.getWithErrorHandler('/admin/country-tags', {
          fallbackKey: 'logistics.error.fetchCountryTagsFailed'
        })
        if (response.success) {
          this.countryTags = response.data.tags || []
        }
      } catch (error) {
        console.error('Error loading country tags:', error)
        this.countryTags = []
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_mixins.scss';

.logistics-companies {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .el-form {
      margin-bottom: 0;
    }
  }

  .companies-list-card {
    .pagination-wrapper {
      margin-top: 20px;
      text-align: right;
    }

    .website-link {
      color: #409eff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// 运费范围管理对话框样式
.shipping-fee-dialog {
  .el-dialog__body {
    padding: 24px;
  }

  .shipping-fee-content {
    .company-info {
      margin-bottom: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);

      h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
          content: '🚚';
          font-size: 24px;
        }
      }

      p {
        margin: 0;
        opacity: 0.9;
        font-size: 14px;
      }
    }

    .action-buttons {
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #409eff;
    }

    .grouping-selector {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e4e7ed;

      .el-radio-group {
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 8px;

        .el-radio-button {
          flex: 1;

          .el-radio-button__inner {
            width: 100%;
            border-radius: 6px;
            transition: all 0.3s ease;
            font-weight: 500;
          }
        }
      }
    }

    .shipping-fee-content-area {
      .group-header {
        margin-bottom: 10px;
        padding: 16px 20px;

        border-radius: 8px;


        h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;

          &::before {
            content: '📋';
            font-size: 18px;
          }
        }

        p {
          margin: 0;
          opacity: 0.9;
          font-size: 13px;
        }
      }

      .shipping-fee-table {
        margin-top: 16px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

        .el-table {
          border-radius: 8px;

          .el-table__header {
            background-color: #f5f7fa;

            th {
              background-color: #f5f7fa !important;
              color: #606266;
              font-weight: 600;
              border-bottom: 2px solid #e4e7ed;
            }
          }

          .el-table__body {
            tr {
              transition: all 0.3s ease;

              &:hover {
                background-color: #f0f9ff !important;
              }
            }

            td {
              padding: 12px 0;
              border-bottom: 1px solid #f0f0f0;
            }
          }
        }
      }

      .el-tabs {
        .el-tabs__header {
          margin-bottom: 20px;
          background-color: #fff;
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

          .el-tabs__nav {
            border: none;

            .el-tabs__item {
              border: none;
              border-radius: 6px;
              margin-right: 8px;
              padding: 12px 20px;
              transition: all 0.3s ease;
              font-weight: 500;

              &.is-active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }

              &:hover:not(.is-active) {
                background-color: #f0f9ff;
                color: #409eff;
              }
            }
          }

          .el-tabs__active-bar {
            display: none;
          }
        }

        .el-tabs__content {
          padding: 0;
        }
      }

      .el-empty {
        padding: 40px 20px;
        background-color: #fafafa;
        border-radius: 8px;
        border: 2px dashed #e4e7ed;
      }
    }
  }

  .el-dialog__footer {
    padding: 20px 24px;
    background-color: #f8f9fa;
    border-top: 1px solid #e4e7ed;

    .el-button {
      padding: 10px 24px;
      border-radius: 6px;
      font-weight: 500;
    }
  }
}

@include mobile {
  .logistics-companies {
    padding: 10px;

    .page-header {
      h1 {
        font-size: 20px;
      }
    }

    .filter-card {
      .el-form {
        .el-form-item {
          display: block;
          margin-bottom: 15px;

          .el-form-item__content {
            margin-left: 0 !important;
          }
        }
      }
    }

    .companies-list-card {
      .el-table {
        font-size: 12px;
      }

      .pagination-wrapper {
        text-align: center;

        .el-pagination {
          justify-content: center;
        }
      }
    }
  }

  .shipping-fee-dialog {
    .el-dialog__body {
      padding: 16px;
    }

    .shipping-fee-content {
      .company-info {
        padding: 16px;
        margin-bottom: 20px;

        h3 {
          font-size: 18px;

          &::before {
            font-size: 20px;
          }
        }
      }

      .action-buttons {
        flex-direction: column;
        gap: 8px;
        padding: 12px;
      }

      .grouping-selector {
        padding: 12px;

        .el-radio-group {
          flex-direction: column;
          gap: 8px;

          .el-radio-button {
            .el-radio-button__inner {
              padding: 8px 12px;
              font-size: 14px;
            }
          }
        }
      }

      .shipping-fee-content-area {
        .group-header {
          padding: 12px 16px;

          h4 {
            font-size: 15px;

            &::before {
              font-size: 16px;
            }
          }

          p {
            font-size: 12px;
          }
        }

        .el-tabs {
          .el-tabs__header {
            padding: 4px;

            .el-tabs__nav {
              .el-tabs__item {
                padding: 8px 12px;
                font-size: 13px;
                margin-right: 4px;
              }
            }
          }
        }

        .shipping-fee-table {
          .el-table {
            font-size: 12px;

            .el-table__body {
              td {
                padding: 8px 0;
              }
            }
          }
        }

        .el-empty {
          padding: 30px 15px;
        }
      }
    }

    .el-dialog__footer {
      padding: 16px;

      .el-button {
        padding: 8px 16px;
        font-size: 14px;
      }
    }
  }
}
</style>