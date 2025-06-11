<template>
  <div class="about-us-admin">
    <div class="admin-header">
      <h1>About Us 管理</h1>
      <div class="header-actions">
        <button @click="showAddNavModal = true" class="btn btn-primary">
          <i class="fas fa-plus"></i> 添加导航
        </button>
      </div>
    </div>

    <!-- 导航管理 -->
    <div class="nav-management">
      <h2>导航管理</h2>
      <div class="table-container">
        <table class="nav-table">
          <thead>
            <tr>
              <th>关键字</th>
              <th>内容类型</th>
              <th>翻译</th>
              <th>状态</th>
              <th>排序</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nav in navList" :key="nav.id">
              <td>{{ nav.name_key }}</td>
              <td>{{ getContentTypeDisplay(nav.content_type) }}</td>
              <td class="translations-cell">
                <div v-if="nav.translations && nav.translations.length > 0" class="translation-tags">
                  <span v-for="translation in nav.translations" :key="translation.language_code" class="translation-tag"
                    :title="translation.name">
                    {{ translation.language_code }}: {{ translation.name }}
                  </span>
                </div>
                <span v-else class="no-translations">无翻译</span>
              </td>
              <td>
                <span :class="['status', nav.is_active ? 'active' : 'inactive']">
                  {{ nav.is_active ? '启用' : '禁用' }}
                </span>
              </td>
              <td>{{ nav.sort_order }}</td>
              <td class="action-buttons">
                <button @click="editNav(nav)" class="btn btn-sm btn-outline">
                  <i class="fas fa-edit"></i> 编辑
                </button>
                <button @click="manageContent(nav)" class="btn btn-sm btn-info">
                  <i class="fas fa-file-alt"></i> 管理内容
                </button>
                <button @click="deleteNav(nav.id)" class="btn btn-sm btn-danger">
                  <i class="fas fa-trash"></i> 删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 内容管理模态框 -->
    <div v-if="showContentModal" class="modal-overlay" @click="closeContentModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>管理内容 - {{ selectedNav?.name }}</h3>
          <button @click="closeContentModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="content-actions">
            <button @click="showAddContentModal = true" class="btn btn-primary">
              <i class="fas fa-plus"></i> 添加内容
            </button>
          </div>
          <div class="content-list">
            <div v-for="content in contentList" :key="content.id" class="content-item">
              <div class="content-info">
                <h4>{{ content.title }}</h4>
                <p>语言: {{ content.language_code }}</p>
                <p>创建时间: {{ new Date(content.created_at).toLocaleString() }}</p>

                <span :class="['status', content.status === 1 ? 'active' : 'inactive']">
                  {{ content.status === 1 ? '启用' : '禁用' }}
                </span>
              </div>
              <div class="content-actions">
                <button @click="editContent(content)" class="btn btn-sm btn-outline">
                  <i class="fas fa-edit"></i> 编辑
                </button>
                <button @click="deleteContent(content.id)" class="btn btn-sm btn-danger">
                  <i class="fas fa-trash"></i> 删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑导航模态框 -->
    <div v-if="showAddNavModal || showEditNavModal" class="modal-overlay" @click="closeNavModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddNavModal ? '添加导航' : '编辑导航' }}</h3>
          <button @click="closeNavModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveNav">
            <div class="form-group">
              <label>关键字:</label>
              <input v-model="navForm.name_key" type="text" required class="form-control">
            </div>
            <div class="form-group">
              <label>内容类型:</label>
              <select v-model="navForm.content_type" class="form-control" required>
                <option v-for="option in contentTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>排序:</label>
              <input v-model.number="navForm.sort_order" type="number" class="form-control">
            </div>
            <div class="form-group">
              <label>
                <input v-model="navForm.is_active" type="checkbox"> 启用
              </label>
            </div>
            <div class="translations">
              <h4>翻译</h4>
              <div v-for="(translation, index) in navForm.translations" :key="index" class="translation-item">
                <div class="form-group">
                  <label>语言代码:</label>
                  <select v-model="translation.language_code" class="form-control">
                    <option v-for="lang in supportedLanguages" :key="lang" :value="lang">
                      {{ getLanguageDisplay(lang) }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>名称:</label>
                  <input v-model="translation.name" type="text" required class="form-control">
                </div>
                <button @click="removeTranslation(index)" type="button" class="btn btn-sm btn-danger">
                  删除翻译
                </button>
              </div>
              <button @click="addTranslation" type="button" class="btn btn-sm btn-outline"
                :disabled="availableLanguages.length === 0">
                添加翻译
              </button>
              <small v-if="availableLanguages.length === 0" class="text-muted">所有支持的语言都已添加</small>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">保存</button>
              <button @click="closeNavModal" type="button" class="btn btn-secondary">取消</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- 添加/编辑内容模态框 -->
    <div v-if="showAddContentModal || showEditContentModal" class="modal-overlay" @click="closeContentModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddContentModal ? '添加内容' : '编辑内容' }}</h3>
          <button @click="closeContentModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveContent">
            <div class="form-group">
              <label>语言代码:</label>
              <select v-model="contentForm.language_code" class="form-control" required>
                <option value="zh-CN">中文</option>
                <option value="en">英文</option>
              </select>
            </div>
            <div class="form-group">
              <label>标题:</label>
              <input v-model="contentForm.title" type="text" required class="form-control">
            </div>
            <div class="form-group">
              <label>内容:</label>
              <quill-editor ref="quillEditor" v-model="contentForm.content" :options="quillOptions" :key="quillKey"
                style="height: 300px" @change="onQuillChange" @ready="onQuillReady" />
            </div>
            <div class="form-group">
              <label>主图:</label>
              <div class="main-image-upload">
                <div v-if="mainImagePreview" class="image-preview">
                  <img :src="mainImagePreview" alt="主图预览" style="max-width: 200px; max-height: 150px;">
                  <button @click="removeMainImage" type="button" class="btn btn-sm btn-danger">删除</button>
                </div>
                <div v-else class="upload-area">
                  <input ref="mainImageInput" type="file" accept="image/*" @change="handleMainImageSelect"
                    style="display: none;">
                  <button @click="$refs.mainImageInput.click()" type="button" class="btn btn-outline">选择主图</button>
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">保存</button>
              <button @click="closeContentModal" type="button" class="btn btn-secondary">取消</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { quillEditor } from 'vue3-quill'
import { getAuthToken } from '@/utils/api'

export default {
  name: 'CommonContent',
  components: {
    quillEditor
  },
  data() {
    return {
      navList: [],
      contentList: [],
      selectedNav: null,
      showAddNavModal: false,
      showEditNavModal: false,
      showContentModal: false,
      showAddContentModal: false,
      showEditContentModal: false,
      supportedLanguages: ['zh-CN', 'en'],
      // Content Type 映射表
      contentTypeMap: {
        'news': {
          'zh-CN': '新闻',
          'en': 'News'
        },
        'about_us': {
          'zh-CN': '关于我们',
          'en': 'About Us'
        },
        'home': {
          'zh-CN': '首页',
          'en': 'Home'
        }
      },
      navForm: {
        name_key: '',
        content_type: 'about_us',
        is_active: true,
        translations: []
      },
      contentForm: {
        nav_id: null,
        language_code: 'zh-CN',
        title: '',
        content: ''
      },
      mainImageFile: null,
      mainImagePreview: null,
      editingNavId: null,
      editingContentId: null,
      sessionId: localStorage.getItem('session_id') || (Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
      quillOptions: {
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
          ]
        }
      },
      quillKey: 0
    }
  },
  computed: {
    // 获取翻译函数
    $t() {
      return this.$store.getters['language/translate'];
    },
    uploadHeaders() {
      const token = getAuthToken(true); // true 表示这是管理员请求
      return {
        Authorization: token ? `Bearer ${token}` : ''
      }
    },
    availableLanguages() {
      const usedLanguages = this.navForm.translations.map(t => t.language_code)
      return this.supportedLanguages.filter(lang => !usedLanguages.includes(lang))
    },
    // 获取当前语言
    currentLanguage() {
      return this.$store.getters['language/currentLanguage'] || 'zh-CN';
    },
    // 获取content type选项列表
    contentTypeOptions() {
      return Object.keys(this.contentTypeMap).map(key => ({
        value: key,
        label: this.getContentTypeDisplay(key)
      }));
    }
  },
  async created() {
    await this.loadNavList()
  },
  methods: {
    // 获取content type的显示名称
    getContentTypeDisplay(contentType) {
      const typeMap = this.contentTypeMap[contentType];
      if (typeMap) {
        return typeMap[this.currentLanguage] || typeMap['zh-CN'] || contentType;
      }
      return contentType;
    },
    
    async loadNavList() {
      try {
        const response = await this.$api.getWithErrorHandler('/common-content/admin/nav', {
          fallbackKey: 'admin.commonContent.error.loadNavFailed'
        })
        if (response && response.data && response.data.navList) {
          // 直接使用后端返回的数据结构
          this.navList = response.data.navList.map(nav => ({
            id: nav.id,
            name_key: nav.name_key,
            content_type: nav.content_type,
            sort_order: nav.sort_order || 0,
            is_active: nav.status === 1, // 1为启用，0为禁用
            translations: nav.translations || []
          }))
          
          // 加载翻译数据
          await this.loadTranslations()
        }
      } catch (error) {
        console.error('加载导航列表失败:', error)
      }
    },

    async loadTranslations() {
      try {
        const response = await this.$api.getWithErrorHandler('/language/admin/translations', {
          fallbackKey: 'admin.commonContent.error.loadTranslationsFailed'
        })
        if (response && response.data) {
          // 将翻译数据映射到导航列表中
          this.navList.forEach(nav => {
            // 查找该导航项的所有翻译（使用name_key匹配）
            const navTranslations = response.data.filter(t => t.code === nav.name_key && t.lang && t.lang.trim() !== '')
            nav.translations = navTranslations.map(t => ({
              language_code: t.lang,
              name: t.value
            }))
         })
        }
      } catch (error) {
        console.error('加载翻译失败:', error)
      }
    },

    async loadContentList(navId) {
      try {
        const response = await this.$api.getWithErrorHandler(`/common-content/admin/content/by-nav/${navId}`, {
          fallbackKey: 'admin.commonContent.error.loadContentFailed'
        })
        if (response && response.data && response.data.contentList) {
          this.contentList = response.data.contentList
        }
      } catch (error) {
        console.error('加载内容列表失败:', error)
      }
    },

    editNav(nav) {
      this.editingNavId = nav.id
      this.navForm = {

        name_key: nav.name_key,
        content_type: nav.content_type,
        sort_order: nav.sort_order,
        is_active: nav.is_active,
        translations: nav.translations || []
      }
      this.showEditNavModal = true
    },

    async manageContent(nav) {
      this.selectedNav = nav
      this.showContentModal = true
      await this.loadContentList(nav.id)
    },

    async editContent(content) {
      this.editingContentId = content.id
      this.contentForm = {
        id: content.id,
        nav_id: content.nav_id,
        language_code: content.language_code,
        title: content.title,
        content: content.content
      }
      
      // 获取该内容的主图
      await this.loadMainImageForContent(content.id)
      
      this.mainImageFile = null
      this.showEditContentModal = true
      this.showAddContentModal = false
    },

    async loadMainImageForContent(contentId) {
      try {
        const token = getAuthToken()
        const response = await fetch(`/api/common-content/images/main/content/${contentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            this.mainImagePreview = result.data.image_url
            this.mainImageUrl = result.data.image_url
          } else {
            this.mainImagePreview = null
            this.mainImageUrl = null
          }
        } else {
          this.mainImagePreview = null
          this.mainImageUrl = null
        }
      } catch (error) {
        console.error('获取主图失败:', error)
        this.mainImagePreview = null
        this.mainImageUrl = null
      }
    },

    async saveNav() {
      try {
        const url = this.showAddNavModal 
          ? '/common-content/admin/nav'
          : `/common-content/admin/nav/${this.editingNavId}`
        
        let response
        if (this.showAddNavModal) {
          response = await this.$api.postWithErrorHandler(url, this.navForm, {
            fallbackKey: 'admin.commonContent.error.addNavFailed'
          })
        } else {
          response = await this.$api.putWithErrorHandler(url, this.navForm, {
            fallbackKey: 'admin.commonContent.error.updateNavFailed'
          })
        }
        
        if (response) {
          // 保存翻译数据
          await this.saveTranslations()
          
          this.$messageHandler.showSuccess(
              this.showAddNavModal ?
                this.$t('admin.commonContent.success.addNav', '添加导航成功') :
                this.$t('admin.commonContent.success.updateNav', '更新导航成功'),
              this.showAddNavModal ? 'admin.commonContent.success.addNav' : 'admin.commonContent.success.updateNav'
            )
          this.closeNavModal()
          await this.loadNavList()
        }
      } catch (error) {
        console.error('保存导航失败:', error)
      }
    },

    async saveTranslations() {
      try {
        // 为每个翻译调用language接口
        for (const translation of this.navForm.translations) {
          if (translation.name && translation.name.trim()) {
            const translationData = {
              code: this.navForm.name_key, // 使用name_key作为翻译的code
              lang: translation.language_code,
              value: translation.name
            }
            
            // 获取所有翻译来检查是否已存在
            const existingResponse = await this.$api.getWithErrorHandler(
              '/language/admin/translations', 
              { fallbackKey: 'admin.commonContent.error.checkTranslationFailed' }
            )
            
            if (existingResponse && existingResponse.data) {
              // 查找是否存在相同code和lang的翻译
              const existingTranslation = existingResponse.data.find(
                t => t.code === this.navForm.name_key && t.lang === translation.language_code
              )
              
              if (existingTranslation) {
                // 更新现有翻译
                await this.$api.putWithErrorHandler(
                  `/language/admin/translations/${existingTranslation.id}`, 
                  translationData,
                  { fallbackKey: 'admin.commonContent.error.updateTranslationFailed' }
                )
              } else {
                // 创建新翻译
                await this.$api.postWithErrorHandler(
                  '/language/admin/translations', 
                  translationData,
                  { fallbackKey: 'admin.commonContent.error.addTranslationFailed' }
                )
              }
            }
          }
        }
      } catch (error) {
        console.error('保存翻译失败:', error)
      }
    },

    async saveContent() {
      try {
        const token = getAuthToken()
        
        // 准备内容数据
        const contentData = {
          nav_id: this.selectedNav.id,
          language_code: this.contentForm.language_code || 'zh-CN',
          title: this.contentForm.title,
          content: this.contentForm.content
        }
        
        let contentResult
        
        if (this.showAddContentModal) {
          // 添加内容
          const response = await fetch('/api/common-content/admin/content', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(contentData)
          })
          
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          
          contentResult = await response.json()
        } else {
          // 更新内容
          const response = await fetch(`/api/common-content/admin/content/${this.editingContentId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(contentData)
          })
          
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          
          contentResult = await response.json()
        }
        
        if (!contentResult.success) {
          throw new Error(contentResult.message || '操作失败')
        }
        
        // 更新contentForm的ID（对于新添加的内容）
        if (this.showAddContentModal && contentResult.data && contentResult.data.id) {
          this.contentForm.id = contentResult.data.id
        }
        
        // 如果有主图，上传主图
        if (this.mainImageFile) {
          await this.uploadMainImage()
        }
        
        this.$messageHandler.showSuccess(
          this.showAddContentModal ?
            this.$t('admin.commonContent.success.addContent', '添加内容成功') :
            this.$t('admin.commonContent.success.updateContent', '更新内容成功'),
          this.showAddContentModal ? 'admin.commonContent.success.addContent' : 'admin.commonContent.success.updateContent'
        )
        
        await this.loadContentList(this.selectedNav.id)
        this.closeContentModal()
        
      } catch (error) {
        console.error('保存内容失败:', error)
        this.$messageHandler.showError(
          this.$t('admin.commonContent.error.saveContentFailed', '保存内容失败'),
          'admin.commonContent.error.saveContentFailed'
        )
      }
    },

    async deleteNav(navId) {
      try {
          await this.$messageHandler.confirm({
            message: this.$t('admin.commonContent.confirm.deleteNav', '确定要删除这个导航吗？'),
            translationKey: 'admin.commonContent.confirm.deleteNav'
          })
        
        const response = await this.$api.deleteWithErrorHandler(`/common-content/admin/nav/${navId}`, {
          fallbackKey: 'admin.commonContent.error.deleteNavFailed'
        })
        
        if (response) {
          this.$messageHandler.showSuccess(
            this.$t('admin.commonContent.success.deleteNav', '删除导航成功'),
            'admin.commonContent.success.deleteNav'
          )
          await this.loadNavList()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除导航失败:', error)
        }
      }
    },

    async deleteContent(contentId) {
      try {
          await this.$messageHandler.confirm({
            message: this.$t('admin.commonContent.confirm.deleteContent', '确定要删除这个内容吗？'),
            translationKey: 'admin.commonContent.confirm.deleteContent'
          })
        
        const response = await this.$api.deleteWithErrorHandler(`/common-content/admin/content/${contentId}`, {
          fallbackKey: 'admin.commonContent.error.deleteContentFailed'
        })
        
        if (response) {
          this.$messageHandler.showSuccess(
            this.$t('admin.commonContent.success.deleteContent', '删除内容成功'),
            'admin.commonContent.success.deleteContent'
          )
          await this.loadContentList(this.selectedNav.id)
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除内容失败:', error)
        }
      }
    },

    addTranslation() {
      if (this.availableLanguages.length > 0) {
        this.navForm.translations.push({
          language_code: this.availableLanguages[0],
          name: ''
        })
      }
    },

    getLanguageDisplay(lang) {
      const languageMap = {
        'zh-CN': '中文',
        'en': '英文'
      }
      return languageMap[lang] || lang
    },

    handleMainImageSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.mainImageFile = file
        const reader = new FileReader()
        reader.onload = (e) => {
          this.mainImagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },

    async removeMainImage() {
      try {
        // 如果是编辑模式且有主图，需要调用后端删除
        if (!this.showAddContentModal && this.mainImagePreview && this.contentForm.id) {
          const token = getAuthToken()
          
          // 获取当前内容的主图ID
          const response = await fetch(`/api/common-content/images/main/content/${this.contentForm.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              // 删除主图
              const deleteResponse = await fetch(`/api/common-content/images/${result.data.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              
              if (deleteResponse.ok) {
                const deleteResult = await deleteResponse.json()
                if (deleteResult.success) {
                  this.$messageHandler.showSuccess('主图删除成功', 'admin.commonContent.success.imageDelete')
                }
              }
            }
          }
        }
        
        // 清空前端状态
        this.mainImageFile = null
        this.mainImagePreview = null
        this.mainImageUrl = null
        if (this.$refs.mainImageInput) {
          this.$refs.mainImageInput.value = ''
        }
        
      } catch (error) {
        console.error('删除主图失败:', error)
        this.$messageHandler.showError('删除主图失败: ' + error.message, 'admin.commonContent.error.imageDeleteFailed')
        
        // 即使删除失败，也清空前端状态
        this.mainImageFile = null
        this.mainImagePreview = null
        this.mainImageUrl = null
        if (this.$refs.mainImageInput) {
          this.$refs.mainImageInput.value = ''
        }
      }
    },

    async uploadMainImage() {
      try {
        // 确保有内容ID
        if (!this.contentForm.id) {
          throw new Error('必须先保存内容才能上传主图')
        }
        
        const token = getAuthToken()
        const formData = new FormData()
        formData.append('images', this.mainImageFile)
        formData.append('nav_id', this.selectedNav.id)
        formData.append('content_id', this.contentForm.id)
        formData.append('image_type', 'main')
        
        const response = await fetch('/api/common-content/images/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.message || '主图上传失败')
        }
        
        console.log('主图上传成功:', result)
        
        // 上传成功后更新主图显示
        if (result.data && result.data.length > 0) {
          this.mainImageUrl = result.data[0].image_url
        }
        
      } catch (error) {
        console.error('主图上传失败:', error)
        this.$messageHandler.showError('主图上传失败: ' + error.message, 'admin.commonContent.error.imageUploadFailed')
      }
    },

    removeTranslation(index) {
      this.navForm.translations.splice(index, 1)
    },

    // 富文本编辑器图片上传处理
    async handleQuillImageUpload(quill) {
      // 创建input选择图片
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        // 构造FormData
        const formData = new FormData();
        formData.append('images', file);
        formData.append('nav_id', this.selectedNav?.id || '');
        formData.append('content_id', this.contentForm?.id || '');
        formData.append('image_type', 'content');
        formData.append('session_id', this.sessionId);
        try {
          const res = await this.$api.postWithErrorHandler('/common-content/images/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...this.uploadHeaders
            },
            fallbackKey: 'admin.commonContent.error.imageUploadFailed'
          });
          if (res && res.success && res.data && res.data.images && res.data.images[0]) {
            const url = res.data.images[0].path;
            const range = quill.getSelection();
            quill.insertEmbed(range ? range.index : 0, 'image', url);
          }
        } catch (err) {
          console.error('图片上传失败:', err);
        }
      };
    },

    onQuillChange(content) {
      // 保证content始终为字符串，避免循环引用
      if (typeof content === 'object' && content.html) {
        this.contentForm.content = content.html;
      } else if (typeof content === 'string') {
        this.contentForm.content = content;
      } else {
        this.contentForm.content = '';
      }
    },

    onQuillReady(quill) {
      // 强制设置内容，兼容v-model不生效的情况
      if (quill && this.contentForm.content) {
        quill.root.innerHTML = this.contentForm.content;
      }
      if (quill && quill.getModule('toolbar')) {
        quill.getModule('toolbar').addHandler('image', () => {
          this.handleQuillImageUpload(quill);
        });
      }
    },
  

    closeNavModal() {
      this.showAddNavModal = false
      this.showEditNavModal = false
      this.editingNavId = null
      this.navForm = {
        name_key: '',
        content_type: 'about_us',
        is_active: true,
        translations: []
      }
    },

    closeContentModal() {
      this.showContentModal = false
      this.showAddContentModal = false
      this.showEditContentModal = false
      this.editingContentId = null
      this.contentForm = {
        nav_id: null,
        language_code: 'zh-CN',
        title: '',
        content: ''
      }
      this.mainImageFile = null
      this.mainImagePreview = null
      if (this.$refs.mainImageInput) {
        this.$refs.mainImageInput.value = ''
      }
    }
  },
  


  mounted() {
    // 配置quill图片上传钩子
    this.$nextTick(() => {
      if (this.$refs.quillEditor && this.$refs.quillEditor.getQuill) {
        const quill = this.$refs.quillEditor.getQuill();
        quill.getModule('toolbar').addHandler('image', () => {
          this.handleQuillImageUpload(quill);
        });
      }
    });

    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', this.sessionId);
    }
  }
}
</script>

<style scoped>
.about-us-admin {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.admin-header h1 {
  margin: 0;
  color: #333;
}

.nav-management {
  margin-bottom: 30px;
}

.nav-management {
  margin-bottom: 30px;
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.nav-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.nav-table th {
  background: #f8f9fa;
  padding: 12px 15px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
}

.nav-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.nav-table tr:hover {
  background: #f8f9fa;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons .btn {
  white-space: nowrap;
}

.translations-cell {
  max-width: 200px;
}

.translation-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.translation-tag {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  border: 1px solid #bbdefb;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-translations {
  color: #999;
  font-style: italic;
  font-size: 12px;
}

.content-list {
  margin-top: 20px;
}

.content-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #f9f9f9;
}

.content-info h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.content-info p {
  margin: 3px 0;
  color: #666;
  font-size: 13px;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.inactive {
  background: #f8d7da;
  color: #721c24;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #117a8b;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
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
  font-weight: bold;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.translations {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f9f9f9;
}

.translations h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.translation-item {
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
  background: white;
}

.content-actions {
  margin-top: 15px;
}

@media (max-width: 768px) {

  .nav-item,
  .content-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .nav-actions,
  .content-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style>