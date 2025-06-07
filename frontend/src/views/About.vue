<template>
  <div class="about-page">
    <PageBanner title="关于我们" />

    <!-- Breadcrumb Section -->
    <div class="breadcrumb-section">
      <div class="container">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>关于我们</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="container">
      <div class="about-section">
        <div class="company-intro">
          <div class="section-title">
            <h2>公司简介</h2>
            <div class="title-underline"></div>
          </div>

          <div class="intro-content">
            <div class="intro-image">
              <img :src="aboutCompanyImage" alt="公司简介" @error="handleImageError">
            </div>
            <div class="intro-text">
              <h3>AUTO EASE EXPERT CO., LTD</h3>
              <p>我们是一家专业从事汽车用品研发、生产和销售的公司，拥有多年的行业经验和专业技术。我们致力于为客户提供高品质、高性能的汽车用品，包括汽车吸尘器、车载充电器和汽车应急启动电源等产品。</p>
              <p>公司成立于2010年，总部位于中国深圳，拥有现代化的生产基地和专业的研发团队。我们的产品远销欧美、亚洲等多个国家和地区，深受客户好评。</p>
              <p>我们秉承"品质至上、客户为先"的经营理念，不断追求技术创新和产品改进，为客户提供更好的产品和服务。我们相信，只有不断提高产品质量和服务水平，才能在激烈的市场竞争中立于不败之地。</p>
            </div>
          </div>
        </div>

        <div class="company-values">
          <div class="section-title">
            <h2>企业文化</h2>
            <div class="title-underline"></div>
          </div>

          <div class="values-grid">
            <div class="value-card">
              <div class="value-icon">
                <el-icon>
                  <Flag />
                </el-icon>
              </div>
              <h3>使命</h3>
              <p>为全球消费者提供高品质、高性能的汽车用品，让汽车生活更便捷、更舒适。</p>
            </div>

            <div class="value-card">
              <div class="value-icon">
                <el-icon>
                  <ViewIcon />
                </el-icon>
              </div>
              <h3>愿景</h3>
              <p>成为全球领先的汽车用品供应商，引领行业发展，创造卓越价值。</p>
            </div>

            <div class="value-card">
              <div class="value-icon">
                <el-icon>
                  <Medal />
                </el-icon>
              </div>
              <h3>价值观</h3>
              <p>诚信、创新、品质、共赢。我们坚持诚信经营，不断创新，追求卓越品质，实现与客户、员工、合作伙伴的共同发展。</p>
            </div>

            <div class="value-card">
              <div class="value-icon">
                <el-icon>
                  <Management />
                </el-icon>
              </div>
              <h3>经营理念</h3>
              <p>品质至上、客户为先。我们始终将产品品质放在首位，以客户需求为导向，不断提升产品和服务质量。</p>
            </div>
          </div>
        </div>

        <div class="company-advantages">
          <div class="section-title">
            <h2>我们的优势</h2>
            <div class="title-underline"></div>
          </div>

          <div class="advantages-list">
            <div class="advantage-item">
              <div class="advantage-icon">
                <el-icon>
                  <Opportunity />
                </el-icon>
              </div>
              <div class="advantage-content">
                <h3>专业研发团队</h3>
                <p>拥有一支经验丰富的研发团队，不断推出创新产品，满足市场需求。</p>
              </div>
            </div>

            <div class="advantage-item">
              <div class="advantage-icon">
                <el-icon>
                  <Service />
                </el-icon>
              </div>
              <div class="advantage-content">
                <h3>严格质量控制</h3>
                <p>建立完善的质量管理体系，从原材料采购到成品出厂，每个环节都严格把关。</p>
              </div>
            </div>

            <div class="advantage-item">
              <div class="advantage-icon">
                <el-icon>
                  <Shop />
                </el-icon>
              </div>
              <div class="advantage-content">
                <h3>现代化生产基地</h3>
                <p>拥有现代化的生产基地和先进的生产设备，确保产品品质和生产效率。</p>
              </div>
            </div>

            <div class="advantage-item">
              <div class="advantage-icon">
                <el-icon>
                  <Trophy />
                </el-icon>
              </div>
              <div class="advantage-content">
                <h3>完善的售后服务</h3>
                <p>提供专业的售后服务，及时解决客户问题，确保客户满意度。</p>
              </div>
            </div>
          </div>
        </div>

        <div class="company-certificates">
          <div class="section-title">
            <h2>荣誉资质</h2>
            <div class="title-underline"></div>
          </div>

          <div class="certificates-grid">
            <div class="certificate-card">
              <div class="certificate-image">
                <img :src="certificate1Image" alt="ISO9001认证" @error="handleImageError">
              </div>
              <div class="certificate-info">
                <h3>ISO9001认证</h3>
                <p>国际质量管理体系认证</p>
              </div>
            </div>

            <div class="certificate-card">
              <div class="certificate-image">
                <img :src="certificate2Image" alt="CE认证" @error="handleImageError">
              </div>
              <div class="certificate-info">
                <h3>CE认证</h3>
                <p>欧盟安全认证</p>
              </div>
            </div>

            <div class="certificate-card">
              <div class="certificate-image">
                <img :src="certificate3Image" alt="RoHS认证" @error="handleImageError">
              </div>
              <div class="certificate-info">
                <h3>RoHS认证</h3>
                <p>欧盟有害物质限制指令认证</p>
              </div>
            </div>

            <div class="certificate-card">
              <div class="certificate-image">
                <img :src="certificate4Image" alt="FCC认证" @error="handleImageError">
              </div>
              <div class="certificate-info">
                <h3>FCC认证</h3>
                <p>美国联邦通信委员会认证</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import aboutCompanyImage from '../assets/images/about-company.jpg';
import certificate1Image from '../assets/images/certificate1.jpg';
import certificate2Image from '../assets/images/certificate2.jpg';
import certificate3Image from '../assets/images/certificate3.jpg';
import certificate4Image from '../assets/images/certificate4.jpg';
import { Flag, Medal, Management, Opportunity, Service, Shop, Trophy } from '@element-plus/icons-vue';
import { View as ViewIcon } from '@element-plus/icons-vue';
import { handleImageError } from '../utils/imageUtils';
import PageBanner from '@/components/common/PageBanner.vue';

export default {
  name: 'AboutPage',
  components: {
    Flag,
    ViewIcon,
    Medal,
    Management,
    Opportunity,
    Service,
    Shop,
    Trophy,
    PageBanner
  },
  data() {
    return {
      companyInfo: {},
      aboutCompanyImage,
      certificate1Image,
      certificate2Image,
      certificate3Image,
      certificate4Image
    }
  },
  methods: {
    async fetchCompanyInfo() {
      try {
        const response = await this.$api.get('company')
        // response已经是标准格式，直接使用response.data
        this.companyInfo = response.data
      } catch (error) {
        // 错误已在api.js中统一处理
        console.error('获取公司信息失败')
      }
    },
    handleImageError
  },
  created() {
    this.fetchCompanyInfo()
  }

}
</script>

<style scoped>
.about-page {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.about-section>div {
  margin-bottom: 60px;
}

.section-title {
  text-align: center;
  margin-bottom: 30px;
}

.section-title h2 {
  font-size: 28px;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
}

.title-underline {
  width: 80px;
  height: 3px;
  background-color: #409EFF;
  margin: 0 auto;
}

/* 公司简介 */
.intro-content {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  align-items: center;
}

.intro-image {
  flex: 1;
  min-width: 300px;
}

.intro-image img {
  width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.intro-text {
  flex: 1;
  min-width: 300px;
}

.intro-text h3 {
  font-size: 22px;
  margin-bottom: 15px;
  color: #409EFF;
}

.intro-text p {
  margin-bottom: 15px;
  line-height: 1.8;
  color: #666;
}

/* 企业文化 */
.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
}

.value-card {
  background-color: #f9f9f9;
  padding: 30px 20px;
  border-radius: 4px;
  text-align: center;
  transition: all 0.3s;
}

.value-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.value-icon {
  font-size: 40px;
  color: #409EFF;
  margin-bottom: 15px;
}

.value-card h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

.value-card p {
  color: #666;
  line-height: 1.6;
}

/* 我们的优势 */
.advantages-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.advantage-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
  transition: all 0.3s;
}

.advantage-item:hover {
  background-color: #f0f9ff;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.advantage-icon {
  font-size: 36px;
  color: #409EFF;
  flex-shrink: 0;
}

.advantage-content h3 {
  font-size: 18px;
  margin-bottom: 10px;
}

.advantage-content p {
  color: #666;
  line-height: 1.6;
}

/* 荣誉资质 */
.certificates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
}

.certificate-card {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
}

.certificate-card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.certificate-image {
  height: 200px;
  overflow: hidden;
}

.certificate-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.certificate-card:hover .certificate-image img {
  transform: scale(1.05);
}

.certificate-info {
  padding: 15px;
  text-align: center;
}

.certificate-info h3 {
  font-size: 16px;
  margin-bottom: 5px;
}

.certificate-info p {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .intro-content {
    flex-direction: column;
  }

  .values-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .certificates-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style>