<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          {{ isInviteMode ? 'Record Your Video' : 'Create New Content' }}
        </h1>
        <p class="text-lg text-gray-600">
          {{ isInviteMode 
            ? 'You\'ve been invited to contribute to this content request' 
            : 'Record video, audio, or screen content in just a few clicks'
          }}
        </p>
      </div>

      <!-- Content Request Info (if invite mode) -->
      <div v-if="isInviteMode && contentRequest" class="mb-8 bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          {{ contentRequest.title }}
        </h2>
        <p class="text-gray-600 mb-4">{{ contentRequest.description }}</p>
        <div class="flex flex-wrap gap-4 text-sm text-gray-500">
          <span class="flex items-center">
            <CalendarIcon class="h-4 w-4 mr-1" />
            Due: {{ formatDate(contentRequest.deadline) }}
          </span>
          <span class="flex items-center">
            <VideoCameraIcon class="h-4 w-4 mr-1" />
            Type: {{ contentRequest.type_display }}
          </span>
        </div>
      </div>

      <!-- Recording Interface -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Recording Controls -->
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Recording Setup</h3>
            <div class="flex space-x-2">
              <button
                @click="toggleRecordingType('video')"
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  recordingType === 'video' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                <VideoCameraIcon class="h-4 w-4 inline mr-1" />
                Video
              </button>
              <button
                @click="toggleRecordingType('screen')"
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  recordingType === 'screen' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                <ComputerDesktopIcon class="h-4 w-4 inline mr-1" />
                Screen
              </button>
              <button
                @click="toggleRecordingType('audio')"
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  recordingType === 'audio' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                ]"
              >
                <MicrophoneIcon class="h-4 w-4 inline mr-1" />
                Audio
              </button>
            </div>
          </div>

          <!-- Recording Status -->
          <div v-if="recordingStatus === 'recording'" class="flex items-center text-red-600 mb-4">
            <div class="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-2"></div>
            <span class="font-medium">Recording in progress...</span>
            <span class="ml-2 text-sm">{{ formatDuration(recordingDuration) }}</span>
          </div>

          <div v-else-if="recordingStatus === 'paused'" class="flex items-center text-yellow-600 mb-4">
            <div class="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
            <span class="font-medium">Recording paused</span>
            <span class="ml-2 text-sm">{{ formatDuration(recordingDuration) }}</span>
          </div>
        </div>

        <!-- Video Preview -->
        <div class="relative bg-black">
          <div class="aspect-video flex items-center justify-center">
            <video
              v-if="recordingStatus !== 'idle' && videoStream"
              ref="videoPreview"
              :srcObject="videoStream"
              autoplay
              muted
              class="w-full h-full object-cover"
            />
            <div v-else class="text-center text-white">
              <VideoCameraIcon class="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p class="text-lg">Camera preview will appear here</p>
              <p class="text-sm opacity-75">Click "Start Recording" to begin</p>
            </div>
          </div>

          <!-- Recording Overlay -->
          <div v-if="recordingStatus === 'recording'" class="absolute top-4 left-4 flex items-center space-x-2">
            <div class="bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
              REC
            </div>
            <div class="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {{ formatDuration(recordingDuration) }}
            </div>
          </div>
        </div>

        <!-- Recording Controls -->
        <div class="p-6 bg-gray-50">
          <div class="flex items-center justify-center space-x-4">
            <!-- Start/Stop Recording -->
            <button
              v-if="recordingStatus === 'idle'"
              @click="startRecording"
              :disabled="!isReadyToRecord"
              class="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlayIcon class="h-5 w-5 mr-2" />
              Start Recording
            </button>

            <button
              v-else-if="recordingStatus === 'recording'"
              @click="stopRecording"
              class="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <StopIcon class="h-5 w-5 mr-2" />
              Stop Recording
            </button>

            <button
              v-else-if="recordingStatus === 'paused'"
              @click="resumeRecording"
              class="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <PlayIcon class="h-5 w-5 mr-2" />
              Resume
            </button>

            <!-- Pause/Resume -->
            <button
              v-if="recordingStatus === 'recording'"
              @click="pauseRecording"
              class="flex items-center px-4 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
            >
              <PauseIcon class="h-5 w-5 mr-2" />
              Pause
            </button>

            <!-- Cancel Recording -->
            <button
              v-if="recordingStatus !== 'idle'"
              @click="cancelRecording"
              class="flex items-center px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              <XMarkIcon class="h-5 w-5 mr-2" />
              Cancel
            </button>
          </div>

          <!-- Recording Tips -->
          <div class="mt-6 text-center text-sm text-gray-600">
            <p v-if="recordingType === 'video'">
              💡 Make sure you have good lighting and a quiet environment
            </p>
            <p v-else-if="recordingType === 'screen'">
              💡 Close unnecessary applications and prepare your screen
            </p>
            <p v-else-if="recordingType === 'audio'">
              💡 Use headphones to avoid echo and speak clearly
            </p>
          </div>
        </div>
      </div>

      <!-- Recording Details Form -->
      <div v-if="recordingStatus === 'completed'" class="mt-8 bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Recording Details</h3>
        <form @submit.prevent="saveRecording">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                v-model="recordingForm.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter video title"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <input
                :value="formatDuration(recordingDuration)"
                type="text"
                disabled
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                v-model="recordingForm.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter video description (optional)"
              />
            </div>

            <div v-if="isInviteMode" class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                v-model="recordingForm.contributorName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              @click="discardRecording"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSaving ? 'Saving...' : 'Save Recording' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useVideoStore } from '../stores/video';
import { useContentRequestStore } from '../stores/contentRequest';
import {
  VideoCameraIcon,
  ComputerDesktopIcon,
  MicrophoneIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline';

export default {
  name: 'VideoRecorder',
  components: {
    VideoCameraIcon,
    ComputerDesktopIcon,
    MicrophoneIcon,
    PlayIcon,
    StopIcon,
    PauseIcon,
    XMarkIcon,
    CalendarIcon
  },
  setup() {
    const route = useRoute();
    const videoStore = useVideoStore();
    const contentRequestStore = useContentRequestStore();
    
    // State
    const recordingType = ref('video');
    const recordingStatus = ref('idle'); // idle, recording, paused, completed
    const recordingDuration = ref(0);
    const videoStream = ref(null);
    const mediaRecorder = ref(null);
    const recordedChunks = ref([]);
    const recordingTimer = ref(null);
    const isSaving = ref(false);
    
    // Form data
    const recordingForm = ref({
      title: '',
      description: '',
      contributorName: ''
    });
    
    // Computed
    const isInviteMode = computed(() => route.name === 'invite-record');
    const contentRequest = computed(() => contentRequestStore.currentRequest);
    const isReadyToRecord = computed(() => {
      return videoStream.value !== null;
    });
    
    // Methods
    const toggleRecordingType = (type) => {
      recordingType.value = type;
      initializeMedia();
    };
    
    const initializeMedia = async () => {
      try {
        let constraints = {};
        
        if (recordingType.value === 'video') {
          constraints = {
            video: { width: 1280, height: 720 },
            audio: true
          };
        } else if (recordingType.value === 'screen') {
          constraints = {
            video: { mediaSource: 'screen' },
            audio: true
          };
        } else if (recordingType.value === 'audio') {
          constraints = {
            audio: true
          };
        }
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoStream.value = stream;
        
        // Update video preview
        if (recordingType.value !== 'audio') {
          const videoElement = document.querySelector('video');
          if (videoElement) {
            videoElement.srcObject = stream;
          }
        }
        
      } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Unable to access camera/microphone. Please check permissions.');
      }
    };
    
    const startRecording = () => {
      if (!videoStream.value) return;
      
      recordedChunks.value = [];
      
      const options = {
        mimeType: 'video/webm;codecs=vp9'
      };
      
      mediaRecorder.value = new MediaRecorder(videoStream.value, options);
      
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data);
        }
      };
      
      mediaRecorder.value.onstop = () => {
        const blob = new Blob(recordedChunks.value, { type: 'video/webm' });
        // Store the blob for later upload
        window.recordedVideoBlob = blob;
        recordingStatus.value = 'completed';
      };
      
      mediaRecorder.value.start();
      recordingStatus.value = 'recording';
      
      // Start timer
      recordingTimer.value = setInterval(() => {
        recordingDuration.value++;
      }, 1000);
    };
    
    const stopRecording = () => {
      if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
        mediaRecorder.value.stop();
        clearInterval(recordingTimer.value);
        recordingStatus.value = 'completed';
      }
    };
    
    const pauseRecording = () => {
      if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
        mediaRecorder.value.pause();
        clearInterval(recordingTimer.value);
        recordingStatus.value = 'paused';
      }
    };
    
    const resumeRecording = () => {
      if (mediaRecorder.value && mediaRecorder.value.state === 'paused') {
        mediaRecorder.value.resume();
        recordingTimer.value = setInterval(() => {
          recordingDuration.value++;
        }, 1000);
        recordingStatus.value = 'recording';
      }
    };
    
    const cancelRecording = () => {
      if (mediaRecorder.value) {
        mediaRecorder.value.stop();
      }
      clearInterval(recordingTimer.value);
      recordingStatus.value = 'idle';
      recordingDuration.value = 0;
      recordedChunks.value = [];
    };
    
    const discardRecording = () => {
      cancelRecording();
      recordingForm.value = {
        title: '',
        description: '',
        contributorName: ''
      };
    };
    
    const saveRecording = async () => {
      if (!window.recordedVideoBlob) return;
      
      isSaving.value = true;
      
      try {
        const formData = new FormData();
        formData.append('video_file', window.recordedVideoBlob, 'recording.webm');
        formData.append('title', recordingForm.value.title);
        formData.append('description', recordingForm.value.description);
        formData.append('recording_type', recordingType.value);
        formData.append('duration', recordingDuration.value);
        
        if (isInviteMode.value && contentRequest.value) {
          formData.append('content_request_id', contentRequest.value.id);
        }
        
        await videoStore.uploadVideo(formData);
        
        // Reset form
        recordingForm.value = {
          title: '',
          description: '',
          contributorName: ''
        };
        
        // Reset recording state
        cancelRecording();
        
        alert('Recording saved successfully!');
        
      } catch (error) {
        console.error('Error saving recording:', error);
        alert('Failed to save recording. Please try again.');
      } finally {
        isSaving.value = false;
      }
    };
    
    const formatDuration = (seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    // Load content request if in invite mode
    const loadContentRequest = async () => {
      if (isInviteMode.value && route.params.token) {
        await contentRequestStore.loadByInviteToken(route.params.token);
      }
    };
    
    onMounted(async () => {
      await loadContentRequest();
      await initializeMedia();
    });
    
    onUnmounted(() => {
      if (videoStream.value) {
        videoStream.value.getTracks().forEach(track => track.stop());
      }
      if (recordingTimer.value) {
        clearInterval(recordingTimer.value);
      }
    });
    
    return {
      recordingType,
      recordingStatus,
      recordingDuration,
      videoStream,
      recordingForm,
      isSaving,
      isInviteMode,
      contentRequest,
      isReadyToRecord,
      toggleRecordingType,
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      cancelRecording,
      discardRecording,
      saveRecording,
      formatDuration,
      formatDate
    };
  }
};
</script>
