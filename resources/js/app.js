import './bootstrap';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

// Import components
import App from './components/App.vue';
import Dashboard from './components/Dashboard.vue';
import VideoRecorder from './components/VideoRecorder.vue';
import ContentLibrary from './components/ContentLibrary.vue';
import ContentRequest from './components/ContentRequest.vue';
import CreateRequest from './components/CreateRequest.vue';
import VideoPlayer from './components/VideoPlayer.vue';
import Collaboration from './components/Collaboration.vue';
import Analytics from './components/Analytics.vue';
import Settings from './components/Settings.vue';

// Import stores
import { useAuthStore } from './stores/auth';
import { useVideoStore } from './stores/video';
import { useContentRequestStore } from './stores/contentRequest';

// Router configuration
const routes = [
    { path: '/', component: Dashboard, name: 'dashboard' },
    { path: '/record', component: VideoRecorder, name: 'record' },
    { path: '/library', component: ContentLibrary, name: 'library' },
    { path: '/requests', component: ContentRequest, name: 'requests' },
    { path: '/requests/create', component: CreateRequest, name: 'create-request' },
    { path: '/video/:id', component: VideoPlayer, name: 'video-player' },
    { path: '/collaboration', component: Collaboration, name: 'collaboration' },
    { path: '/analytics', component: Analytics, name: 'analytics' },
    { path: '/settings', component: Settings, name: 'settings' },
    { path: '/invite/:token', component: VideoRecorder, name: 'invite-record' }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Create app
const app = createApp(App);

// Use plugins
app.use(createPinia());
app.use(router);
app.use(Toast, {
    position: 'top-right',
    timeout: 3000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false
});

// Global properties
app.config.globalProperties.$filters = {
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },
    
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    },
    
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// Mount app
app.mount('#app');
