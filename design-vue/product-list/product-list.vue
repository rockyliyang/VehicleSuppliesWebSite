<!-- The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work. -->
<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-20">
          <div class="flex items-center">
            <img
              src="https://readdy.ai/api/search-image?query=modern%20sleek%20red%20car%20logo%20design%20for%20Auto%20Ease%20Xpert%20Co%20Ltd%20with%20dynamic%20flowing%20lines%20representing%20speed%20and%20efficiency%20clean%20professional%20automotive%20brand%20identity&width=200&height=60&seq=logo1&orientation=landscape"
              alt="AUTO EASE XPERT CO., LTD."
              class="h-12"
            />
          </div>
          <nav class="hidden md:flex space-x-12">
            <a href="#" class="text-base text-gray-600 hover:text-red-600"
              >首页</a
            >
            <a href="#" class="text-base text-gray-600 hover:text-red-600"
              >关于我们</a
            >
            <a href="#" class="text-base text-red-600 font-medium">产品</a>
            <a href="#" class="text-base text-gray-600 hover:text-red-600"
              >新闻</a
            >
            <a href="#" class="text-base text-gray-600 hover:text-red-600"
              >联系我们</a
            >
          </nav>
          <div class="flex items-center space-x-6">
            <a href="#" class="text-gray-600 hover:text-red-600">
              <i class="fas fa-search text-xl"></i>
            </a>
            <button class="md:hidden text-gray-600">
              <i class="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
    <!-- Hero Banner -->
    <div class="relative w-full h-80 overflow-hidden">
      <img
        src="https://readdy.ai/api/search-image?query=modern%20car%20interior%20dashboard%20with%20high%20tech%20features%20black%20leather%20seats%20premium%20finish%20luxury%20automobile%20cockpit%20with%20digital%20displays%20and%20elegant%20design%20professional%20product%20photography&width=1440&height=320&seq=hero1&orientation=landscape"
        alt="汽车内饰"
        class="w-full h-full object-cover object-top"
      />
      <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center">
        <div class="container mx-auto px-4">
          <h1 class="text-white text-4xl font-bold mb-4">汽车配件专家</h1>
          <p class="text-white text-xl max-w-2xl">
            我们提供高品质的汽车电子产品，让您的驾驶体验更加安全、便捷和舒适。
          </p>
        </div>
      </div>
    </div>
    <!-- Category Navigation -->
    <div class="bg-white shadow-md">
      <div class="container mx-auto px-4">
        <div class="flex overflow-x-auto py-4 space-x-4 category-tabs">
          <button
            class="category-tab active whitespace-nowrap !rounded-button cursor-pointer"
            @click="setActiveCategory('all')"
          >
            全部产品
          </button>
          <button
            class="category-tab whitespace-nowrap !rounded-button cursor-pointer"
            @click="setActiveCategory('vacuum')"
          >
            车载吸尘器
          </button>
          <button
            class="category-tab whitespace-nowrap !rounded-button cursor-pointer"
            @click="setActiveCategory('inflator')"
          >
            轮胎充气泵
          </button>
          <button
            class="category-tab whitespace-nowrap !rounded-button cursor-pointer"
            @click="setActiveCategory('gauge')"
          >
            轮胎压力表
          </button>
          <button
            class="category-tab whitespace-nowrap !rounded-button cursor-pointer"
            @click="setActiveCategory('jumper')"
          >
            汽车启动电源
          </button>
          <button
            class="category-tab whitespace-nowrap !rounded-button cursor-pointer"
            @click="setActiveCategory('power')"
          >
            便携电源站
          </button>
        </div>
      </div>
    </div>
    <!-- Product List -->
    <main class="flex-grow bg-gray-50 py-12">
      <div class="container mx-auto px-4">
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <!-- Product Card 1 -->
          <div
            class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=modern%20handheld%20car%20vacuum%20cleaner%20with%20white%20and%20orange%20design%20professional%20product%20photography%20on%20clean%20white%20background%20high%20quality%20detailed%20image%20of%20automotive%20cleaning%20tool&width=300&height=300&seq=prod1&orientation=squarish"
                alt="XVG-203 车载吸尘器"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                XVG-203 车载吸尘器
              </h3>
              <p class="text-gray-600 text-sm mb-4">
                强力吸尘，轻巧便携，适合车内清洁
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">¥ 299.00</span>
                <button
                  class="bg-red-600 text-white px-3 py-1 rounded-full text-sm !rounded-button whitespace-nowrap cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
          <!-- Product Card 2 -->
          <div
            class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=modern%20handheld%20car%20vacuum%20cleaner%20with%20transparent%20chamber%20and%20red%20accents%20professional%20product%20photography%20on%20clean%20white%20background%20high%20quality%20detailed%20image%20of%20automotive%20cleaning%20tool&width=300&height=300&seq=prod2&orientation=squarish"
                alt="XVG-501 吸尘器"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                XVG-501 吸尘器
              </h3>
              <p class="text-gray-600 text-sm mb-4">
                大功率吸尘，透明集尘仓，方便清理
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">¥ 359.00</span>
                <button
                  class="bg-red-600 text-white px-3 py-1 rounded-full text-sm !rounded-button whitespace-nowrap cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
          <!-- Product Card 3 -->
          <div
            class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=sleek%20black%20portable%20jump%20starter%20power%20bank%20professional%20product%20photography%20on%20clean%20white%20background%20high%20quality%20detailed%20image%20of%20automotive%20emergency%20tool&width=300&height=300&seq=prod3&orientation=squarish"
                alt="F-32 2000A 便携式汽车启动电源"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                F-32 2000A 便携式汽车启动电源
              </h3>
              <p class="text-gray-600 text-sm mb-4">
                2000A 峰值电流，适用于 12V 车辆
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">¥ 499.00</span>
                <button
                  class="bg-red-600 text-white px-3 py-1 rounded-full text-sm !rounded-button whitespace-nowrap cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
          <!-- Product Card 4 -->
          <div
            class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=red%20and%20black%20rugged%20portable%20power%20station%20jump%20starter%20with%20waterproof%20design%20professional%20product%20photography%20on%20clean%20white%20background%20high%20quality%20detailed%20image%20of%20automotive%20emergency%20tool&width=300&height=300&seq=prod4&orientation=squarish"
                alt="F27 便携式防水汽车启动电源"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                F27 便携式防水汽车启动电源
              </h3>
              <p class="text-gray-600 text-sm mb-4">
                3000A 峰值电流，IP67 防水设计
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">¥ 599.00</span>
                <button
                  class="bg-red-600 text-white px-3 py-1 rounded-full text-sm !rounded-button whitespace-nowrap cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
          <!-- Product Card 5 -->
          <div
            class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=compact%20portable%20car%20jump%20starter%20with%20jumper%20cables%20professional%20product%20photography%20on%20clean%20white%20background%20high%20quality%20detailed%20image%20of%20automotive%20emergency%20tool%20with%20red%20and%20black%20design&width=300&height=300&seq=prod5&orientation=squarish"
                alt="F-38 4000A 12V/24V 汽车启动电源"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                F-38 4000A 12V/24V 汽车启动电源
              </h3>
              <p class="text-gray-600 text-sm mb-4">
                适用于 12V/24V 车辆，4000A 峰值电流
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">¥ 699.00</span>
                <button
                  class="bg-red-600 text-white px-3 py-1 rounded-full text-sm !rounded-button whitespace-nowrap cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
          <!-- Product Card 6 -->
          <div
            class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=compact%20red%20and%20black%20portable%20jump%20starter%20power%20bank%20professional%20product%20photography%20on%20clean%20white%20background%20high%20quality%20detailed%20image%20of%20automotive%20emergency%20tool&width=300&height=300&seq=prod6&orientation=squarish"
                alt="F-25 2000A 汽车启动电源"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                F-25 2000A 汽车启动电源
              </h3>
              <p class="text-gray-600 text-sm mb-4">
                紧凑型设计，2000A 峰值电流
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">¥ 459.00</span>
                <button
                  class="bg-red-600 text-white px-3 py-1 rounded-full text-sm !rounded-button whitespace-nowrap cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
          <!-- Product Card 7 -->
          <div
            class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=sleek%20blue%20wireless%20charger%20jump%20starter%20with%20LED%20display%20professional%20product%20photography%20on%20clean%20white%20background%20high%20quality%20detailed%20image%20of%20automotive%20emergency%20tool&width=300&height=300&seq=prod7&orientation=squarish"
                alt="F-18 无线充电汽车启动电源"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                F-18 无线充电汽车启动电源
              </h3>
              <p class="text-gray-600 text-sm mb-4">支持无线充电，LED 显示屏</p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">¥ 559.00</span>
                <button
                  class="bg-red-600 text-white px-3 py-1 rounded-full text-sm !rounded-button whitespace-nowrap cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
          <!-- Product Card 8 -->
          <div
            class="product-card bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=compact%20black%20portable%20car%20jump%20starter%20with%20digital%20display%20professional%20product%20photography%20on%20clean%20white%20background%20high%20quality%20detailed%20image%20of%20automotive%20emergency%20tool&width=300&height=300&seq=prod8&orientation=squarish"
                alt="F-8 12V 汽车启动电源"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">
                F-8 12V 汽车启动电源
              </h3>
              <p class="text-gray-600 text-sm mb-4">
                小巧便携，适用于 12V 车辆
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">¥ 399.00</span>
                <button
                  class="bg-red-600 text-white px-3 py-1 rounded-full text-sm !rounded-button whitespace-nowrap cursor-pointer"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- Pagination -->
        <div class="mt-12 flex justify-center items-center space-x-4">
          <div class="flex items-center space-x-2">
            <a
              href="#"
              class="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 !rounded-button whitespace-nowrap cursor-pointer"
              >Home</a
            >
            <a
              href="#"
              class="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 !rounded-button whitespace-nowrap cursor-pointer"
              >Previous page</a
            >
            <a
              href="#"
              class="px-4 py-2 border border-red-600 bg-red-600 text-white !rounded-button whitespace-nowrap cursor-pointer"
              >1</a
            >
            <a
              href="#"
              class="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 !rounded-button whitespace-nowrap cursor-pointer"
              >2</a
            >
            <a
              href="#"
              class="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 !rounded-button whitespace-nowrap cursor-pointer"
              >3</a
            >
            <a
              href="#"
              class="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 !rounded-button whitespace-nowrap cursor-pointer"
              >4</a
            >
            <a
              href="#"
              class="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 !rounded-button whitespace-nowrap cursor-pointer"
              >Next page</a
            >
            <a
              href="#"
              class="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-100 !rounded-button whitespace-nowrap cursor-pointer"
              >Last Page</a
            >
          </div>
          <div class="flex items-center space-x-2">
            <button
              class="px-4 py-2 bg-red-600 text-white !rounded-button whitespace-nowrap cursor-pointer hover:bg-red-700"
            >
              Jump
            </button>
          </div>
        </div>
      </div>
    </main>
    <!-- Customer Service Floating Button -->
    <div class="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
      <div class="bg-red-600 text-white p-3 rounded-l-lg shadow-lg">
        <div class="text-center mb-2">
          <p class="text-sm font-bold">客户服务</p>
        </div>
        <div class="space-y-2">
          <a
            href="#"
            class="flex items-center space-x-2 text-sm p-1 hover:bg-red-700 rounded cursor-pointer"
          >
            <i class="fab fa-whatsapp"></i>
            <span>WhatsApp 1</span>
          </a>
          <a
            href="#"
            class="flex items-center space-x-2 text-sm p-1 hover:bg-red-700 rounded cursor-pointer"
          >
            <i class="fab fa-whatsapp"></i>
            <span>WhatsApp 2</span>
          </a>
          <a
            href="#"
            class="flex items-center space-x-2 text-sm p-1 hover:bg-red-700 rounded cursor-pointer"
          >
            <i class="fab fa-whatsapp"></i>
            <span>WhatsApp 3</span>
          </a>
        </div>
      </div>
    </div>
    <!-- Footer -->
    <footer class="bg-black text-white">
      <div class="container mx-auto px-4 py-16">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 class="text-xl font-bold mb-6">关于我们</h3>
            <p class="text-gray-400 text-sm leading-relaxed">
              Auto Ease Xpert Co., Ltd.
              专注于汽车电子产品的研发和销售，为客户提供高品质的汽车配件解决方案。
            </p>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-6">联系方式</h3>
            <div class="space-y-4 text-gray-400">
              <p class="flex items-center">
                <i class="fas fa-phone-alt mr-3"></i>
                <span>400-8000-000</span>
              </p>
              <p class="flex items-center">
                <i class="fas fa-envelope mr-3"></i>
                <span>info@autoeasexpert.com</span>
              </p>
              <p class="flex items-center">
                <i class="fas fa-map-marker-alt mr-3"></i>
                <span>广东省深圳市宝安区XX街道XX号</span>
              </p>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-6">快速链接</h3>
            <ul class="space-y-3 text-gray-400">
              <li><a href="#" class="hover:text-red-500">关于我们</a></li>
              <li><a href="#" class="hover:text-red-500">产品中心</a></li>
              <li><a href="#" class="hover:text-red-500">新闻资讯</a></li>
              <li><a href="#" class="hover:text-red-500">联系我们</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-6">关注我们</h3>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-400 hover:text-red-500">
                <i class="fab fa-weixin text-2xl"></i>
              </a>
              <a href="#" class="text-gray-400 hover:text-red-500">
                <i class="fab fa-weibo text-2xl"></i>
              </a>
              <a href="#" class="text-gray-400 hover:text-red-500">
                <i class="fab fa-youtube text-2xl"></i>
              </a>
              <a href="#" class="text-gray-400 hover:text-red-500">
                <i class="fab fa-facebook text-2xl"></i>
              </a>
            </div>
          </div>
        </div>
        <div class="mt-12 pt-8 border-t border-gray-800">
          <div class="flex flex-col md:flex-row justify-between items-center">
            <p class="text-gray-400 text-sm">
              © 2025 Auto Ease Xpert Co., Ltd. 版权所有
            </p>
            <div class="flex space-x-6 mt-4 md:mt-0">
              <img
                src="https://readdy.ai/api/search-image?query=visa%20payment%20logo%20icon%20white%20minimal%20design&width=40&height=25&seq=payment1&orientation=landscape"
                alt="Visa"
                class="h-6"
              />
              <img
                src="https://readdy.ai/api/search-image?query=mastercard%20payment%20logo%20icon%20white%20minimal%20design&width=40&height=25&seq=payment2&orientation=landscape"
                alt="Mastercard"
                class="h-6"
              />
              <img
                src="https://readdy.ai/api/search-image?query=paypal%20payment%20logo%20icon%20white%20minimal%20design&width=40&height=25&seq=payment3&orientation=landscape"
                alt="PayPal"
                class="h-6"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
const activeCategory = ref("all");
const setActiveCategory = (category: string) => {
  activeCategory.value = category;
  // 更新类样式
  const tabs = document.querySelectorAll(".category-tab");
  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });
  const currentTab =
    document.querySelector(`.category-tab[data-category="${category}"]`) ||
    document.querySelector(
      `.category-tab:nth-child(${["all", "vacuum", "inflator", "gauge", "jumper", "power"].indexOf(category) + 1})`,
    );
  if (currentTab) {
    currentTab.classList.add("active");
  }
  // 这里可以添加产品过滤逻辑
};
</script>

<style scoped>
.category-tab {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #4b5563;
  position: relative;
}
.category-tab:hover {
  color: #dc2626;
}
.category-tab.active {
  color: #dc2626;
}
.category-tab.active::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #dc2626;
}
.product-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.product-card:hover {
  transform: translateY(-5px);
}
.category-tabs {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.category-tabs::-webkit-scrollbar {
  display: none;
}
</style>
