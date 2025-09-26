<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <router-link to="/" class="flex items-center">
                <img class="h-8 w-auto" src="/images/logo.svg" alt="MarketScale" />
                <span class="ml-2 text-xl font-bold text-gray-900">MarketScale</span>
              </router-link>
            </div>
            
            <!-- Navigation Links -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/"
                class="nav-link"
                :class="{ 'nav-link-active': $route.name === 'dashboard' }"
              >
                Dashboard
              </router-link>
              <router-link
                to="/record"
                class="nav-link"
                :class="{ 'nav-link-active': $route.name === 'record' }"
              >
                Record
              </router-link>
              <router-link
                to="/library"
                class="nav-link"
                :class="{ 'nav-link-active': $route.name === 'library' }"
              >
                Library
              </router-link>
              <router-link
                to="/requests"
                class="nav-link"
                :class="{ 'nav-link-active': $route.name === 'requests' }"
              >
                Requests
              </router-link>
              <router-link
                to="/collaboration"
                class="nav-link"
                :class="{ 'nav-link-active': $route.name === 'collaboration' }"
              >
                Collaboration
              </router-link>
              <router-link
                to="/analytics"
                class="nav-link"
                :class="{ 'nav-link-active': $route.name === 'analytics' }"
              >
                Analytics
              </router-link>
            </div>
          </div>
          
          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <!-- Notifications -->
            <button
              @click="toggleNotifications"
              class="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span class="sr-only">View notifications</span>
              <BellIcon class="h-6 w-6" />
              <span
                v-if="unreadNotifications > 0"
                class="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {{ unreadNotifications }}
              </span>
            </button>
            
            <!-- Profile Dropdown -->
            <div class="relative" ref="profileDropdown">
              <button
                @click="toggleProfileDropdown"
                class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span class="sr-only">Open user menu</span>
                <img
                  class="h-8 w-8 rounded-full"
                  :src="user?.avatar || '/images/default-avatar.png'"
                  :alt="user?.name"
                />
                <span class="ml-2 text-gray-700">{{ user?.name }}</span>
                <ChevronDownIcon class="ml-1 h-4 w-4 text-gray-400" />
              </button>
              
              <!-- Dropdown Menu -->
              <div
                v-show="showProfileDropdown"
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
              >
                <router-link
                  to="/settings"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </router-link>
                <a
                  href="#"
                  @click="logout"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile Navigation -->
    <div v-show="showMobileMenu" class="sm:hidden">
      <div class="pt-2 pb-3 space-y-1">
        <router-link
          to="/"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'dashboard' }"
        >
          Dashboard
        </router-link>
        <router-link
          to="/record"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'record' }"
        >
          Record
        </router-link>
        <router-link
          to="/library"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'library' }"
        >
          Library
        </router-link>
        <router-link
          to="/requests"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'requests' }"
        >
          Requests
        </router-link>
        <router-link
          to="/collaboration"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'collaboration' }"
        >
          Collaboration
        </router-link>
        <router-link
          to="/analytics"
          class="mobile-nav-link"
          :class="{ 'mobile-nav-link-active': $route.name === 'analytics' }"
        >
          Analytics
        </router-link>
      </div>
    </div>

    <!-- Main Content -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Notifications Panel -->
    <div
      v-show="showNotifications"
      class="fixed inset-0 z-50 overflow-hidden"
      @click="closeNotifications"
    >
      <div class="absolute inset-0 bg-black bg-opacity-25" />
      <div class="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">Notifications</h3>
          <button
            @click="closeNotifications"
            class="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
        <div class="p-4">
          <div v-if="notifications.length === 0" class="text-center text-gray-500">
            No notifications
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div
                    class="h-2 w-2 bg-blue-500 rounded-full"
                    v-if="!notification.read"
                  />
                </div>
                <div class="ml-3 flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ notification.title }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ $filters.formatDate(notification.created_at) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { BellIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'App',
  components: {
    BellIcon,
    ChevronDownIcon,
    XMarkIcon
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const showProfileDropdown = ref(false);
    const showMobileMenu = ref(false);
    const showNotifications = ref(false);
    const notifications = ref([]);
    const unreadNotifications = ref(0);
    
    const user = ref(authStore.user);
    
    const toggleProfileDropdown = () => {
      showProfileDropdown.value = !showProfileDropdown.value;
    };
    
    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value;
    };
    
    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value;
    };
    
    const closeNotifications = () => {
      showNotifications.value = false;
    };
    
    const logout = async () => {
      await authStore.logout();
      router.push('/login');
    };
    
    const handleClickOutside = (event) => {
      if (showProfileDropdown.value && !event.target.closest('[ref="profileDropdown"]')) {
        showProfileDropdown.value = false;
      }
    };
    
    const loadNotifications = async () => {
      try {
        // Mock notifications for demo
        notifications.value = [
          {
            id: 1,
            title: 'New video submitted',
            message: 'John Doe submitted a video for "Product Demo" request',
            read: false,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            title: 'AI editing complete',
            message: 'Your video "Tutorial Series" has been processed',
            read: true,
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        
        unreadNotifications.value = notifications.value.filter(n => !n.read).length;
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };
    
    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
      loadNotifications();
    });
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });
    
    return {
      user,
      showProfileDropdown,
      showMobileMenu,
      showNotifications,
      notifications,
      unreadNotifications,
      toggleProfileDropdown,
      toggleMobileMenu,
      toggleNotifications,
      closeNotifications,
      logout
    };
  }
};
</script>

<style scoped>
.nav-link {
  @apply inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors duration-200;
}

.nav-link-active {
  @apply border-indigo-500 text-gray-900;
}

.mobile-nav-link {
  @apply block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200;
}

.mobile-nav-link-active {
  @apply border-indigo-500 text-indigo-700 bg-indigo-50;
}
</style>
