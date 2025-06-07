<template>
  <div class="news-page">
    <PageBanner title="新闻资讯" />

    <!-- Breadcrumb Section -->
    <div class="breadcrumb-section">
      <div class="container">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>新闻资讯</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="container">
      <div class="news-section">
        <div class="news-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="公司新闻" name="company">
              <div class="news-list">
                <div v-for="(item, index) in companyNews" :key="index" class="news-item">
                  <div class="news-image">
                    <img :src="item.image" :alt="item.title" @error="handleImageError">
                  </div>
                  <div class="news-content">
                    <h3 class="news-title">{{ item.title }}</h3>
                    <div class="news-meta">
                      <span><i class="el-icon-date"></i> {{ item.date }}</span>
                      <span><i class="el-icon-view"></i> {{ item.views }}</span>
                    </div>
                    <p class="news-summary">{{ item.summary }}</p>
                    <el-button link class="read-more">阅读更多 <i class="el-icon-arrow-right"></i></el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="行业资讯" name="industry">
              <div class="news-list">
                <div v-for="(item, index) in industryNews" :key="index" class="news-item">
                  <div class="news-image">
                    <img :src="item.image" :alt="item.title" @error="handleImageError">
                  </div>
                  <div class="news-content">
                    <h3 class="news-title">{{ item.title }}</h3>
                    <div class="news-meta">
                      <span><i class="el-icon-date"></i> {{ item.date }}</span>
                      <span><i class="el-icon-view"></i> {{ item.views }}</span>
                    </div>
                    <p class="news-summary">{{ item.summary }}</p>
                    <el-button link class="read-more">阅读更多 <i class="el-icon-arrow-right"></i></el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="pagination-container">
          <el-pagination background layout="prev, pager, next" :total="50" :page-size="5"
            @current-change="handleCurrentChange"></el-pagination>
        </div>
      </div>

      <div class="sidebar">
        <div class="sidebar-section popular-news">
          <h3 class="sidebar-title">热门新闻</h3>
          <ul class="popular-news-list">
            <li v-for="(item, index) in popularNews" :key="index" class="popular-news-item">
              <div class="popular-news-image">
                <img :src="item.image" :alt="item.title" @error="handleImageError">
              </div>
              <div class="popular-news-content">
                <h4>{{ item.title }}</h4>
                <span class="news-date"><i class="el-icon-date"></i> {{ item.date }}</span>
              </div>
            </li>
          </ul>
        </div>

        <div class="sidebar-section news-categories">
          <h3 class="sidebar-title">新闻分类</h3>
          <ul class="category-list">
            <li><a href="javascript:;">公司新闻 (10)</a></li>
            <li><a href="javascript:;">行业资讯 (15)</a></li>
            <li><a href="javascript:;">产品动态 (8)</a></li>
            <li><a href="javascript:;">技术分享 (5)</a></li>
            <li><a href="javascript:;">展会信息 (3)</a></li>
          </ul>
        </div>

        <div class="sidebar-section news-tags">
          <h3 class="sidebar-title">标签云</h3>
          <div class="tag-cloud">
            <el-tag size="small">汽车用品</el-tag>
            <el-tag size="small" type="success">吸尘器</el-tag>
            <el-tag size="small" type="info">充电器</el-tag>
            <el-tag size="small" type="warning">启动电源</el-tag>
            <el-tag size="small" type="danger">新品发布</el-tag>
            <el-tag size="small">技术创新</el-tag>
            <el-tag size="small" type="success">展会</el-tag>
            <el-tag size="small" type="info">行业趋势</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { handleImageError } from '../utils/imageUtils';
import PageBanner from '@/components/common/PageBanner.vue';

export default {
  name: 'NewsPage',
  components: {
    PageBanner
  },
  data() {
    return {
      activeTab: 'company',
      currentPage: 1,
      companyNews: [
        {
          title: '我司新款汽车吸尘器XWC-004正式上市',
          date: '2023-06-15',
          views: 1256,
          image: require('../assets/images/news1.jpg'),
          summary: '我司最新研发的汽车吸尘器XWC-004于今日正式上市。该产品采用全新设计，具有更强的吸力和更长的续航时间，是汽车清洁的理想选择。'
        },
        {
          title: '公司荣获"年度优秀供应商"称号',
          date: '2023-05-20',
          views: 986,
          image: require('../assets/images/news2.jpg'),
          summary: '在近日举行的2023年度供应商评选活动中，我公司凭借优质的产品和服务，荣获"年度优秀供应商"称号。'
        }
      ],
      industryNews: [
        {
          title: '全球汽车用品市场预计2024年增长15%',
          date: '2023-06-10',
          views: 1542,
          image: require('../assets/images/news3.jpg'),
          summary: '根据最新市场研究报告，全球汽车用品市场预计在2024年将增长15%，其中车载电子产品和智能配件将成为增长最快的细分市场。'
        },
        {
          title: '新能源汽车配件需求激增，行业迎来新机遇',
          date: '2023-05-28',
          views: 1205,
          image: require('../assets/images/news4.jpg'),
          summary: '随着新能源汽车市场的快速发展，相关配件和用品需求激增，为汽车用品行业带来了新的发展机遇和挑战。'
        }
      ],
      popularNews: [
        {
          title: '我司新款汽车吸尘器XWC-004正式上市',
          date: '2023-06-15',
          image: require('../assets/images/news1.jpg')
        },
        {
          title: '全球汽车用品市场预计2024年增长15%',
          date: '2023-06-10',
          image: require('../assets/images/news3.jpg')
        },
        {
          title: '新能源汽车配件需求激增，行业迎来新机遇',
          date: '2023-05-28',
          image: require('../assets/images/news4.jpg')
        }
      ]
    };
  },
  methods: {
    handleImageError,
    handleCurrentChange(val) {
      this.currentPage = val;
      // 在实际项目中，这里会请求对应页码的数据
      console.log(`当前页: ${val}`);
    }
  }
}
</script>

<style scoped>
.news-page {
  min-height: 100vh;
}


.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.news-section {
  flex: 1;
  min-width: 300px;
}

.sidebar {
  width: 300px;
}

.news-item {
  display: flex;
  margin-bottom: 30px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s;
}

.news-item:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.news-image {
  width: 280px;
  height: 180px;
  overflow: hidden;
}

.news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.news-item:hover .news-image img {
  transform: scale(1.05);
}

.news-content {
  flex: 1;
  padding: 20px;
}

.news-title {
  font-size: 18px;
  margin-bottom: 10px;
}

.news-meta {
  display: flex;
  gap: 15px;
  color: #999;
  font-size: 14px;
  margin-bottom: 10px;
}

.news-summary {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.read-more {
  color: #409EFF;
  padding: 0;
}

.pagination-container {
  text-align: center;
  margin-top: 20px;
  margin-bottom: 40px;
}

.sidebar-section {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  font-size: 18px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.popular-news-item {
  display: flex;
  margin-bottom: 15px;
}

.popular-news-image {
  width: 80px;
  height: 60px;
  margin-right: 10px;
  overflow: hidden;
  border-radius: 4px;
}

.popular-news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.popular-news-content h4 {
  font-size: 14px;
  margin: 0 0 5px;
  line-height: 1.4;
}

.news-date {
  font-size: 12px;
  color: #999;
}

.category-list li {
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.category-list li a {
  color: #666;
  text-decoration: none;
  transition: color 0.3s;
}

.category-list li a:hover {
  color: #409EFF;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }

  .news-item {
    flex-direction: column;
  }

  .news-image {
    width: 100%;
    height: 200px;
  }
}
</style>