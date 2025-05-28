<!-- The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work. -->
<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-md">
      <div
        class="container mx-auto px-4 py-3 flex justify-between items-center"
      >
        <div class="flex items-center">
          <a href="#" class="flex items-center">
            <img
              src="https://static.readdy.ai/image/01b5af88fa941f59119e27a41ea4862d/63b7adac1fa1c8b6813bfaf6742a426b.png"
              alt="Auto Ease Tech X Logo"
              class="h-12"
            />
          </a>
        </div>
        <nav class="hidden md:flex items-center space-x-8">
          <a
            href="#"
            class="text-red-600 font-medium hover:text-red-800 whitespace-nowrap"
            >Home</a
          >
          <a
            href="#"
            class="text-gray-700 font-medium hover:text-red-600 whitespace-nowrap"
            >About Us</a
          >
          <a
            href="#"
            class="text-gray-700 font-medium hover:text-red-600 whitespace-nowrap"
            >Products</a
          >
          <a
            href="#"
            class="text-gray-700 font-medium hover:text-red-600 whitespace-nowrap"
            >News</a
          >
          <a
            href="#"
            class="text-gray-700 font-medium hover:text-red-600 whitespace-nowrap"
            >Contact Us</a
          >
        </nav>
        <div class="flex items-center space-x-4">
          <!-- Language Selector -->
          <div class="relative" x-data="{ open: false }">
            <button
              @click="open = !open"
              class="flex items-center space-x-1 text-gray-700 hover:text-red-600 cursor-pointer"
            >
              <span class="text-sm">English</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div
              x-show="open"
              @click.away="open = false"
              class="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50"
            >
              <a
                href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >English</a
              >
              <a
                href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >中文</a
              >
            </div>
          </div>
          <!-- Shopping Cart -->
          <div class="relative" x-data="{ cartOpen: false }">
            <button
              @click="cartOpen = !cartOpen"
              class="flex items-center text-gray-700 hover:text-red-600 cursor-pointer"
            >
              <i class="fas fa-shopping-cart text-xl"></i>
              <span
                class="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >1</span
              >
            </button>
            <div
              x-show="cartOpen"
              @click.away="cartOpen = false"
              class="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-2 z-50"
            >
              <div class="px-4 py-2 border-b">
                <p class="text-sm font-medium">我的订单</p>
              </div>
              <div class="p-4">
                <p class="text-sm text-gray-500">购物车是空的</p>
              </div>
            </div>
          </div>
          <!-- User Menu -->
          <div
            class="relative"
            x-data="{ userMenuOpen: false, isLoggedIn: false }"
          >
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center space-x-2 text-gray-700 hover:text-red-600"
            >
              <i class="fas fa-user-circle text-xl"></i>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div
              x-show="userMenuOpen"
              @click.away="userMenuOpen = false"
              class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
            >
              <template x-if="!isLoggedIn">
                <div>
                  <a
                    href="#"
                    @click="isLoggedIn = true"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >登录</a
                  >
                  <a
                    href="#"
                    @click="isLoggedIn = true"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >注册</a
                  >
                </div>
              </template>
              <template x-if="isLoggedIn">
                <div>
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >个人中心</a
                  >
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >我的订单</a
                  >
                  <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >收货地址</a
                  >
                  <hr class="my-1" />
                  <a
                    href="#"
                    @click="isLoggedIn = false"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >退出</a
                  >
                </div>
              </template>
            </div>
          </div>
        </div>
        <button
          class="md:hidden text-gray-700 focus:outline-none cursor-pointer"
        >
          <i class="fas fa-bars text-xl"></i>
        </button>
      </div>
    </header>
    <!-- Hero Section -->
    <section
      class="relative bg-gradient-to-r from-orange-500 to-orange-400 overflow-hidden"
    >
      <div class="absolute inset-0">
        <img
          src="https://readdy.ai/api/search-image?query=premium%20car%20vacuum%20cleaner%20with%20strong%20suction%20power%20on%20elegant%20orange%20gradient%20background%20with%20dynamic%20lines%20professional%20product%20photography%20with%20dramatic%20lighting%20and%20clean%20minimalist%20aesthetic&width=1440&height=600&seq=hero1&orientation=landscape"
          alt="Car Vacuum Cleaner"
          class="w-full h-full object-cover object-top"
        />
      </div>
      <div class="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div class="max-w-2xl">
          <h1 class="text-3xl md:text-5xl font-bold text-white mb-4">
            CAR VACUUM CLEANER
          </h1>
          <p class="text-xl md:text-2xl font-semibold text-white mb-8">
            STRONG SUCTION
          </p>
          <p class="text-lg text-white mb-8">
            EASY TO CLEAN ALL KINDS OF GARBAGE
          </p>
          <div
            class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mb-8"
          >
            <div class="flex items-center">
              <i class="fas fa-phone-alt text-white mr-2"></i>
              <span class="text-white">+1 (800) 567-8901</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-envelope text-white mr-2"></i>
              <span class="text-white">info@autoeasexpert.com</span>
            </div>
          </div>
          <button
            class="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-300 !rounded-button whitespace-nowrap cursor-pointer"
          >
            Shop Now <i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    </section>
    <!-- Products Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-2">
            Our <span class="text-red-600">Products</span>
          </h2>
          <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p class="text-gray-600 max-w-3xl mx-auto">
            We offer the best selection of automotive electronic products. Our
            high-quality car vacuum cleaners, tire inflators, and jump starters
            are designed for maximum performance and reliability.
          </p>
        </div>
        <!-- Product Categories Tabs -->
        <div class="mb-10">
          <div class="flex flex-wrap justify-center gap-2 mb-8">
            <button
              class="px-6 py-2 bg-red-600 text-white rounded-md !rounded-button whitespace-nowrap cursor-pointer"
            >
              Car Vacuum Cleaner
            </button>
            <button
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 !rounded-button whitespace-nowrap cursor-pointer"
            >
              Tire Inflator
            </button>
            <button
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 !rounded-button whitespace-nowrap cursor-pointer"
            >
              Jump Starter
            </button>
            <button
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 !rounded-button whitespace-nowrap cursor-pointer"
            >
              Car Jump Starter
            </button>
            <button
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 !rounded-button whitespace-nowrap cursor-pointer"
            >
              Portable Power Station
            </button>
            <button
              class="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 !rounded-button whitespace-nowrap cursor-pointer"
            >
              More
            </button>
          </div>
        </div>
        <!-- Product Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Product 1 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-64 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=handheld%20car%20vacuum%20cleaner%20with%20orange%20and%20white%20design%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod1&orientation=squarish"
                alt="AXX-201 Car Vacuum Cleaner"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">
                AXX-201 Car Vacuum Cleaner
              </h3>
              <p class="text-gray-600 text-sm mb-3">
                Powerful suction with long battery life
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">$59.99</span>
                <button
                  class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- Product 2 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-64 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=transparent%20handheld%20car%20vacuum%20cleaner%20with%20visible%20internal%20components%20modern%20design%20with%20red%20accents%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography&width=400&height=400&seq=prod2&orientation=squarish"
                alt="AXX-104 Vacuum Cleaner"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">AXX-104 Vacuum Cleaner</h3>
              <p class="text-gray-600 text-sm mb-3">
                Transparent design with visible filtration
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">$69.99</span>
                <button
                  class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- Product 3 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-64 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=sleek%20blue%20and%20silver%20car%20vacuum%20cleaner%20with%20ergonomic%20design%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod3&orientation=squarish"
                alt="AXX-150 Car Vacuum Cleaner"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">
                AXX-150 Car Vacuum Cleaner
              </h3>
              <p class="text-gray-600 text-sm mb-3">
                Ergonomic design with multiple attachments
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">$79.99</span>
                <button
                  class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- Product 4 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-64 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=compact%20white%20car%20vacuum%20cleaner%20with%20black%20accents%20modern%20minimalist%20design%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod4&orientation=squarish"
                alt="AXX-175 Car Vacuum Cleaner"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">
                AXX-175 Car Vacuum Cleaner
              </h3>
              <p class="text-gray-600 text-sm mb-3">
                Compact design with powerful performance
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">$49.99</span>
                <button
                  class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- Product 5 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-64 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=handheld%20car%20vacuum%20cleaner%20with%20cylindrical%20design%20white%20and%20clear%20container%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod5&orientation=squarish"
                alt="AXX-110 Car Vacuum Cleaner"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">
                AXX-110 Car Vacuum Cleaner
              </h3>
              <p class="text-gray-600 text-sm mb-3">
                Cylindrical design with easy emptying
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">$54.99</span>
                <button
                  class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- Product 6 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-64 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=black%20handheld%20car%20vacuum%20cleaner%20with%20ergonomic%20grip%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod6&orientation=squarish"
                alt="AXX-105 Car Vacuum Cleaner"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">
                AXX-105 Car Vacuum Cleaner
              </h3>
              <p class="text-gray-600 text-sm mb-3">
                Ergonomic grip with LED lighting
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">$64.99</span>
                <button
                  class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- Product 7 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-64 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=black%20and%20blue%20car%20vacuum%20cleaner%20with%20crevice%20tool%20attachment%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod7&orientation=squarish"
                alt="AXX-125 Car Vacuum Cleaner"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">
                AXX-125 Car Vacuum Cleaner
              </h3>
              <p class="text-gray-600 text-sm mb-3">
                With specialized crevice tools
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">$59.99</span>
                <button
                  class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
          <!-- Product 8 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-64 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=silver%20metallic%20car%20vacuum%20cleaner%20with%20sleek%20modern%20design%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod8&orientation=squarish"
                alt="AXX-175 Car Vacuum Cleaner"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-4">
              <h3 class="text-lg font-semibold mb-2">
                AXX-175 Car Vacuum Cleaner
              </h3>
              <p class="text-gray-600 text-sm mb-3">
                Premium metallic finish with HEPA filter
              </p>
              <div class="flex justify-between items-center">
                <span class="text-red-600 font-bold">$89.99</span>
                <button
                  class="text-red-600 hover:text-red-800 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mt-12">
          <button
            class="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-300 !rounded-button whitespace-nowrap cursor-pointer"
          >
            View All Products <i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    </section>
    <!-- About Us Section -->
    <section class="py-16 bg-gray-100">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center gap-12">
          <div class="md:w-1/2">
            <h2 class="text-3xl font-bold mb-2">
              About <span class="text-red-600">Us</span>
            </h2>
            <div class="w-24 h-1 bg-red-600 mb-6"></div>
            <p class="text-gray-700 mb-6">
              We are a leading manufacturer of automotive electronic products.
              Our Smart car vacuum cleaners, portable tire inflators, and
              reliable jump starters are designed with the latest technology to
              provide exceptional performance and durability.
            </p>
            <p class="text-gray-700 mb-6">
              With over 15 years of industry experience, we've built a
              reputation for quality and innovation. Our dedicated team of
              engineers and designers work tirelessly to create products that
              exceed customer expectations and solve real-world problems.
            </p>
            <p class="text-gray-700 mb-6">
              At Auto Ease Xpert Co., Ltd., we're committed to providing
              exceptional customer service and support. We stand behind every
              product we sell with comprehensive warranties and responsive
              technical assistance.
            </p>
            <button
              class="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-300 !rounded-button whitespace-nowrap cursor-pointer"
            >
              Learn More <i class="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
          <div class="md:w-1/2">
            <img
              src="https://readdy.ai/api/search-image?query=modern%20car%20interior%20dashboard%20with%20high%20tech%20display%20and%20clean%20design%20futuristic%20automotive%20technology%20with%20blue%20ambient%20lighting%20professional%20photography%20with%20dramatic%20lighting%20on%20black%20background&width=600&height=400&seq=about1&orientation=landscape"
              alt="Automotive Technology"
              class="rounded-lg shadow-lg w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
    <!-- Features Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-2">
            Why Choose <span class="text-red-600">Our Products</span>
          </h2>
          <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p class="text-gray-600 max-w-3xl mx-auto">
            Our automotive electronic products are designed with cutting-edge
            technology and premium materials to ensure exceptional performance
            and durability.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-6 rounded-lg shadow-md text-center">
            <div
              class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="fas fa-bolt text-red-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-3">Powerful Performance</h3>
            <p class="text-gray-600">
              Our products deliver exceptional power and efficiency for all your
              automotive needs.
            </p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md text-center">
            <div
              class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="fas fa-battery-full text-red-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-3">Long Battery Life</h3>
            <p class="text-gray-600">
              Extended runtime ensures your devices are ready when you need them
              most.
            </p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md text-center">
            <div
              class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="fas fa-cog text-red-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-3">Durable Construction</h3>
            <p class="text-gray-600">
              Built to last with premium materials and rigorous quality control
              standards.
            </p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md text-center">
            <div
              class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="fas fa-lightbulb text-red-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-3">Innovative Design</h3>
            <p class="text-gray-600">
              Cutting-edge features and ergonomic designs for maximum
              convenience.
            </p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md text-center">
            <div
              class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="fas fa-shield-alt text-red-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-3">Safety Certified</h3>
            <p class="text-gray-600">
              All products meet or exceed international safety standards and
              regulations.
            </p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-md text-center">
            <div
              class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <i class="fas fa-headset text-red-600 text-2xl"></i>
            </div>
            <h3 class="text-xl font-semibold mb-3">Exceptional Support</h3>
            <p class="text-gray-600">
              Dedicated customer service team ready to assist with any questions
              or concerns.
            </p>
          </div>
        </div>
      </div>
    </section>
    <!-- News Section -->
    <section class="py-16 bg-gray-100">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-2">News</h2>
          <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p class="text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest news, product releases, and automotive
            care tips from our experts.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- News Item 1 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=person%20using%20orange%20car%20vacuum%20cleaner%20to%20clean%20car%20interior%20professional%20lifestyle%20photography%20showing%20product%20in%20use%20close%20up%20shot%20with%20warm%20lighting%20and%20clean%20modern%20aesthetic&width=400&height=300&seq=news1&orientation=landscape"
                alt="How to properly clean your car interior"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-6">
              <div class="flex items-center text-gray-500 text-sm mb-2">
                <i class="far fa-calendar-alt mr-2"></i>
                <span>May 25, 2025</span>
              </div>
              <h3 class="text-xl font-semibold mb-3">
                How to properly clean your car interior
              </h3>
              <p class="text-gray-600 mb-4">
                Learn the best techniques and tools for keeping your car's
                interior spotless and fresh all year round.
              </p>
              <a
                href="#"
                class="text-red-600 font-medium hover:text-red-800 inline-flex items-center cursor-pointer"
              >
                Read More <i class="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
          <!-- News Item 2 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=car%20dashboard%20with%20modern%20technology%20display%20showing%20battery%20status%20and%20power%20indicators%20professional%20automotive%20photography%20with%20blue%20ambient%20lighting%20clean%20modern%20aesthetic&width=400&height=300&seq=news2&orientation=landscape"
                alt="What should I look for when buying a car vacuum cleaner?"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-6">
              <div class="flex items-center text-gray-500 text-sm mb-2">
                <i class="far fa-calendar-alt mr-2"></i>
                <span>May 20, 2025</span>
              </div>
              <h3 class="text-xl font-semibold mb-3">
                What should I look for when buying a car vacuum cleaner?
              </h3>
              <p class="text-gray-600 mb-4">
                A comprehensive guide to choosing the right car vacuum cleaner
                for your specific needs and vehicle type.
              </p>
              <a
                href="#"
                class="text-red-600 font-medium hover:text-red-800 inline-flex items-center cursor-pointer"
              >
                Read More <i class="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
          <!-- News Item 3 -->
          <div
            class="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
          >
            <div class="h-56 overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=person%20using%20orange%20car%20vacuum%20cleaner%20to%20clean%20car%20seats%20professional%20lifestyle%20photography%20showing%20product%20in%20use%20with%20warm%20lighting%20and%20clean%20modern%20aesthetic%20close%20up%20of%20vacuum%20removing%20dirt&width=400&height=300&seq=news3&orientation=landscape"
                alt="Why is regular car interior cleaning important?"
                class="w-full h-full object-cover object-center"
              />
            </div>
            <div class="p-6">
              <div class="flex items-center text-gray-500 text-sm mb-2">
                <i class="far fa-calendar-alt mr-2"></i>
                <span>May 15, 2025</span>
              </div>
              <h3 class="text-xl font-semibold mb-3">
                Why is regular car interior cleaning important?
              </h3>
              <p class="text-gray-600 mb-4">
                Discover the health benefits and value preservation advantages
                of maintaining a clean car interior.
              </p>
              <a
                href="#"
                class="text-red-600 font-medium hover:text-red-800 inline-flex items-center cursor-pointer"
              >
                Read More <i class="fas fa-arrow-right ml-2"></i>
              </a>
            </div>
          </div>
        </div>
        <div class="text-center mt-12">
          <button
            class="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-300 !rounded-button whitespace-nowrap cursor-pointer"
          >
            View All News <i class="fas fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    </section>
    <!-- Testimonials Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-2">
            Customer <span class="text-red-600">Testimonials</span>
          </h2>
          <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p class="text-gray-600 max-w-3xl mx-auto">
            See what our customers have to say about our products and services.
          </p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Testimonial 1 -->
          <div class="bg-gray-50 p-6 rounded-lg shadow-md">
            <div class="flex items-center mb-4">
              <div class="text-yellow-400 flex">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
              </div>
            </div>
            <p class="text-gray-700 italic mb-6">
              "The AXX-201 Car Vacuum Cleaner has been a game-changer for
              keeping my car clean. The suction power is impressive, and the
              battery lasts much longer than expected. Highly recommended!"
            </p>
            <div class="flex items-center">
              <div
                class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4"
              >
                <i class="fas fa-user text-red-600"></i>
              </div>
              <div>
                <h4 class="font-semibold">Michael Johnson</h4>
                <p class="text-gray-500 text-sm">Verified Customer</p>
              </div>
            </div>
          </div>
          <!-- Testimonial 2 -->
          <div class="bg-gray-50 p-6 rounded-lg shadow-md">
            <div class="flex items-center mb-4">
              <div class="text-yellow-400 flex">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
              </div>
            </div>
            <p class="text-gray-700 italic mb-6">
              "I've tried several car vacuum cleaners, but the AXX-150 is by far
              the best. The attachments make it easy to reach every corner of my
              car, and the ergonomic design makes it comfortable to use for
              extended periods."
            </p>
            <div class="flex items-center">
              <div
                class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4"
              >
                <i class="fas fa-user text-red-600"></i>
              </div>
              <div>
                <h4 class="font-semibold">Sarah Williams</h4>
                <p class="text-gray-500 text-sm">Verified Customer</p>
              </div>
            </div>
          </div>
          <!-- Testimonial 3 -->
          <div class="bg-gray-50 p-6 rounded-lg shadow-md">
            <div class="flex items-center mb-4">
              <div class="text-yellow-400 flex">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star-half-alt"></i>
              </div>
            </div>
            <p class="text-gray-700 italic mb-6">
              "Customer service at Auto Ease Xpert is exceptional. When I had
              questions about my purchase, they responded quickly and resolved
              my issue immediately. The product quality matches their service
              excellence."
            </p>
            <div class="flex items-center">
              <div
                class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4"
              >
                <i class="fas fa-user text-red-600"></i>
              </div>
              <div>
                <h4 class="font-semibold">David Thompson</h4>
                <p class="text-gray-500 text-sm">Verified Customer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Contact Section -->
    <section class="py-16 bg-gray-100">
      <div class="container mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-2">
            Contact <span class="text-red-600">Us</span>
          </h2>
          <div class="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p class="text-gray-600 max-w-3xl mx-auto">
            Have questions or need assistance? Our team is here to help. Reach
            out to us using any of the methods below.
          </p>
        </div>
        <div class="flex flex-col md:flex-row gap-12">
          <div class="md:w-1/2">
            <div class="bg-white p-8 rounded-lg shadow-md">
              <h3 class="text-2xl font-semibold mb-6">Send Us a Message</h3>
              <form>
                <div class="mb-4">
                  <label for="name" class="block text-gray-700 mb-2"
                    >Your Name</label
                  >
                  <input
                    type="text"
                    id="name"
                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div class="mb-4">
                  <label for="email" class="block text-gray-700 mb-2"
                    >Your Email</label
                  >
                  <input
                    type="email"
                    id="email"
                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div class="mb-4">
                  <label for="subject" class="block text-gray-700 mb-2"
                    >Subject</label
                  >
                  <input
                    type="text"
                    id="subject"
                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter subject"
                  />
                </div>
                <div class="mb-6">
                  <label for="message" class="block text-gray-700 mb-2"
                    >Message</label
                  >
                  <textarea
                    id="message"
                    rows="5"
                    class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter your message"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  class="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-300 w-full !rounded-button whitespace-nowrap cursor-pointer"
                >
                  Send Message <i class="fas fa-paper-plane ml-2"></i>
                </button>
              </form>
            </div>
          </div>
          <div class="md:w-1/2">
            <div class="bg-white p-8 rounded-lg shadow-md mb-8">
              <h3 class="text-2xl font-semibold mb-6">Contact Information</h3>
              <div class="space-y-6">
                <div class="flex items-start">
                  <div
                    class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 shrink-0"
                  >
                    <i class="fas fa-map-marker-alt text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 class="font-semibold text-lg mb-1">Our Location</h4>
                    <p class="text-gray-600">
                      123 Innovation Drive, Tech Park, CA 94103, United States
                    </p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div
                    class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 shrink-0"
                  >
                    <i class="fas fa-phone-alt text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 class="font-semibold text-lg mb-1">Phone Number</h4>
                    <p class="text-gray-600">+1 (800) 567-8901</p>
                    <p class="text-gray-600">+1 (800) 567-8902</p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div
                    class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 shrink-0"
                  >
                    <i class="fas fa-envelope text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 class="font-semibold text-lg mb-1">Email Address</h4>
                    <p class="text-gray-600">info@autoeasexpert.com</p>
                    <p class="text-gray-600">support@autoeasexpert.com</p>
                  </div>
                </div>
                <div class="flex items-start">
                  <div
                    class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4 shrink-0"
                  >
                    <i class="fas fa-clock text-red-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 class="font-semibold text-lg mb-1">Working Hours</h4>
                    <p class="text-gray-600">
                      Monday - Friday: 9:00 AM - 6:00 PM
                    </p>
                    <p class="text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-white p-8 rounded-lg shadow-md">
              <h3 class="text-2xl font-semibold mb-6">Connect With Us</h3>
              <div class="flex space-x-4">
                <a
                  href="#"
                  class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition duration-300 cursor-pointer"
                >
                  <i class="fab fa-facebook-f"></i>
                </a>
                <a
                  href="#"
                  class="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition duration-300 cursor-pointer"
                >
                  <i class="fab fa-twitter"></i>
                </a>
                <a
                  href="#"
                  class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition duration-300 cursor-pointer"
                >
                  <i class="fab fa-youtube"></i>
                </a>
                <a
                  href="#"
                  class="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center text-white hover:bg-pink-700 transition duration-300 cursor-pointer"
                >
                  <i class="fab fa-instagram"></i>
                </a>
                <a
                  href="#"
                  class="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800 transition duration-300 cursor-pointer"
                >
                  <i class="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <!-- Footer -->
    <footer class="bg-gray-900 text-white pt-16 pb-8">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <img
              src="https://static.readdy.ai/image/01b5af88fa941f59119e27a41ea4862d/63b7adac1fa1c8b6813bfaf6742a426b.png"
              alt="Auto Ease Tech X Logo"
              class="h-12 mb-6"
            />
            <p class="text-gray-400 mb-6">
              Auto Ease Xpert Co., Ltd. is a leading manufacturer of
              high-quality automotive electronic products designed to make your
              driving experience more comfortable and convenient.
            </p>
            <div class="flex space-x-4">
              <a
                href="#"
                class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
              >
                <i class="fab fa-facebook-f"></i>
              </a>
              <a
                href="#"
                class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
              >
                <i class="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
              >
                <i class="fab fa-instagram"></i>
              </a>
              <a
                href="#"
                class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
              >
                <i class="fab fa-linkedin-in"></i>
              </a>
              <a
                href="#"
                class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
              >
                <i class="fab fa-youtube"></i>
              </a>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-6">Quick Links</h3>
            <ul class="space-y-3">
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Home</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >About Us</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Products</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >News</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Contact Us</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >FAQs</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Privacy Policy</a
                >
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-6">Our Products</h3>
            <ul class="space-y-3">
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Car Vacuum Cleaners</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Tire Inflators</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Jump Starters</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Car Jump Starters</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Portable Power Stations</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >Accessories</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-400 hover:text-white transition duration-300 cursor-pointer"
                  >New Arrivals</a
                >
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-6">Contact Information</h3>
            <ul class="space-y-4">
              <li class="flex items-start">
                <i class="fas fa-map-marker-alt text-red-600 mt-1 mr-3"></i>
                <span class="text-gray-400"
                  >123 Innovation Drive, Tech Park, CA 94103, United
                  States</span
                >
              </li>
              <li class="flex items-center">
                <i class="fas fa-phone-alt text-red-600 mr-3"></i>
                <span class="text-gray-400">+1 (800) 567-8901</span>
              </li>
              <li class="flex items-center">
                <i class="fas fa-envelope text-red-600 mr-3"></i>
                <span class="text-gray-400">info@autoeasexpert.com</span>
              </li>
              <li class="flex items-center">
                <i class="fas fa-clock text-red-600 mr-3"></i>
                <span class="text-gray-400">Mon-Fri: 9:00 AM - 6:00 PM</span>
              </li>
            </ul>
            <div class="mt-6">
              <img
                src="https://readdy.ai/api/search-image?query=qr%20code%20placeholder%20simple%20black%20and%20white%20design%20on%20transparent%20background%20minimalist%20vector%20illustration&width=120&height=120&seq=qr1&orientation=squarish"
                alt="QR Code"
                class="w-24 h-24"
              />
            </div>
          </div>
        </div>
        <div class="pt-8 border-t border-gray-800 text-center">
          <div class="flex flex-wrap justify-center gap-4 mb-6">
            <div class="flex items-center">
              <i class="fab fa-cc-visa text-2xl mr-2"></i>
              <span class="text-gray-400">Visa</span>
            </div>
            <div class="flex items-center">
              <i class="fab fa-cc-mastercard text-2xl mr-2"></i>
              <span class="text-gray-400">Mastercard</span>
            </div>
            <div class="flex items-center">
              <i class="fab fa-cc-paypal text-2xl mr-2"></i>
              <span class="text-gray-400">PayPal</span>
            </div>
            <div class="flex items-center">
              <i class="fab fa-cc-amex text-2xl mr-2"></i>
              <span class="text-gray-400">American Express</span>
            </div>
            <div class="flex items-center">
              <i class="fab fa-apple-pay text-2xl mr-2"></i>
              <span class="text-gray-400">Apple Pay</span>
            </div>
          </div>
          <p class="text-gray-500">
            © 2025 Auto Ease Xpert Co., Ltd. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
    <!-- WhatsApp Fixed Button -->
    <div class="fixed bottom-6 right-6 z-50">
      <a
        href="#"
        class="bg-green-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition duration-300 cursor-pointer"
      >
        <i class="fab fa-whatsapp text-2xl"></i>
      </a>
    </div>
    <!-- Back to Top Button -->
    <div class="fixed bottom-6 left-6 z-50">
      <a
        href="#"
        class="bg-red-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition duration-300 cursor-pointer"
      >
        <i class="fas fa-arrow-up text-xl"></i>
      </a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
// Cart state
const cartCount = ref(1);
const cartItems = ref([]);
// User state
const isLoggedIn = ref(false);
const userMenuOpen = ref(false);
const cartOpen = ref(false);
const languageOpen = ref(false);
// Toggle functions
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};
const toggleCart = () => {
  cartOpen.value = !cartOpen.value;
};
const toggleLanguage = () => {
  languageOpen.value = !languageOpen.value;
};
const login = () => {
  isLoggedIn.value = true;
};
const logout = () => {
  isLoggedIn.value = false;
  userMenuOpen.value = false;
};
// Product data
const products = ref([
  {
    id: 1,
    name: "AXX-201 Car Vacuum Cleaner",
    description: "Powerful suction with long battery life",
    price: "$59.99",
    image:
      "https://readdy.ai/api/search-image?query=handheld%20car%20vacuum%20cleaner%20with%20orange%20and%20white%20design%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod1&orientation=squarish",
  },
  {
    id: 2,
    name: "AXX-104 Vacuum Cleaner",
    description: "Transparent design with visible filtration",
    price: "$69.99",
    image:
      "https://readdy.ai/api/search-image?query=transparent%20handheld%20car%20vacuum%20cleaner%20with%20visible%20internal%20components%20modern%20design%20with%20red%20accents%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography&width=400&height=400&seq=prod2&orientation=squarish",
  },
  {
    id: 3,
    name: "AXX-150 Car Vacuum Cleaner",
    description: "Ergonomic design with multiple attachments",
    price: "$79.99",
    image:
      "https://readdy.ai/api/search-image?query=sleek%20blue%20and%20silver%20car%20vacuum%20cleaner%20with%20ergonomic%20design%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod3&orientation=squarish",
  },
  {
    id: 4,
    name: "AXX-175 Car Vacuum Cleaner",
    description: "Compact design with powerful performance",
    price: "$49.99",
    image:
      "https://readdy.ai/api/search-image?query=compact%20white%20car%20vacuum%20cleaner%20with%20black%20accents%20modern%20minimalist%20design%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod4&orientation=squarish",
  },
  {
    id: 5,
    name: "AXX-110 Car Vacuum Cleaner",
    description: "Cylindrical design with easy emptying",
    price: "$54.99",
    image:
      "https://readdy.ai/api/search-image?query=handheld%20car%20vacuum%20cleaner%20with%20cylindrical%20design%20white%20and%20clear%20container%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod5&orientation=squarish",
  },
  {
    id: 6,
    name: "AXX-105 Car Vacuum Cleaner",
    description: "Ergonomic grip with LED lighting",
    price: "$64.99",
    image:
      "https://readdy.ai/api/search-image?query=black%20handheld%20car%20vacuum%20cleaner%20with%20ergonomic%20grip%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod6&orientation=squarish",
  },
  {
    id: 7,
    name: "AXX-125 Car Vacuum Cleaner",
    description: "With specialized crevice tools",
    price: "$59.99",
    image:
      "https://readdy.ai/api/search-image?query=black%20and%20blue%20car%20vacuum%20cleaner%20with%20crevice%20tool%20attachment%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod7&orientation=squarish",
  },
  {
    id: 8,
    name: "AXX-175 Car Vacuum Cleaner",
    description: "Premium metallic finish with HEPA filter",
    price: "$89.99",
    image:
      "https://readdy.ai/api/search-image?query=silver%20metallic%20car%20vacuum%20cleaner%20with%20sleek%20modern%20design%20powerful%20portable%20device%20for%20car%20cleaning%20on%20clean%20white%20background%20professional%20product%20photography%20with%20soft%20shadows&width=400&height=400&seq=prod8&orientation=squarish",
  },
]);
// News data
const news = ref([
  {
    id: 1,
    title: "How to properly clean your car interior",
    description:
      "Learn the best techniques and tools for keeping your car's interior spotless and fresh all year round.",
    date: "May 25, 2025",
    image:
      "https://readdy.ai/api/search-image?query=person%20using%20orange%20car%20vacuum%20cleaner%20to%20clean%20car%20interior%20professional%20lifestyle%20photography%20showing%20product%20in%20use%20close%20up%20shot%20with%20warm%20lighting%20and%20clean%20modern%20aesthetic&width=400&height=300&seq=news1&orientation=landscape",
  },
  {
    id: 2,
    title: "What should I look for when buying a car vacuum cleaner?",
    description:
      "A comprehensive guide to choosing the right car vacuum cleaner for your specific needs and vehicle type.",
    date: "May 20, 2025",
    image:
      "https://readdy.ai/api/search-image?query=car%20dashboard%20with%20modern%20technology%20display%20showing%20battery%20status%20and%20power%20indicators%20professional%20automotive%20photography%20with%20blue%20ambient%20lighting%20clean%20modern%20aesthetic&width=400&height=300&seq=news2&orientation=landscape",
  },
  {
    id: 3,
    title: "Why is regular car interior cleaning important?",
    description:
      "Discover the health benefits and value preservation advantages of maintaining a clean car interior.",
    date: "May 15, 2025",
    image:
      "https://readdy.ai/api/search-image?query=person%20using%20orange%20car%20vacuum%20cleaner%20to%20clean%20car%20seats%20professional%20lifestyle%20photography%20showing%20product%20in%20use%20with%20warm%20lighting%20and%20clean%20modern%20aesthetic%20close%20up%20of%20vacuum%20removing%20dirt&width=400&height=300&seq=news3&orientation=landscape",
  },
]);
// Scroll to top function
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
onMounted(() => {
  // Add event listener for back to top button
  const backToTopButton = document.querySelector(".fixed.bottom-6.left-6");
  if (backToTopButton) {
    backToTopButton.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToTop();
    });
  }
});
</script>

<style scoped>
/* Custom styles */
.text-red-600 {
  color: #dc2626;
}
.bg-red-600 {
  background-color: #dc2626;
}
.hover\:bg-red-700:hover {
  background-color: #b91c1c;
}
input:focus,
textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.3);
}
/* Remove number input arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
