import { defineStore } from 'pinia';
import axios from 'axios';

export const useVideoStore = defineStore('video', {
  state: () => ({
    videos: [],
    currentVideo: null,
    loading: false,
    error: null,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0
    },
    filters: {
      status: 'all',
      recording_type: 'all',
      search: ''
    }
  }),

  getters: {
    publishedVideos: (state) => state.videos.filter(video => video.status === 'ready' && video.published_at),
    processingVideos: (state) => state.videos.filter(video => video.status === 'processing'),
    draftVideos: (state) => state.videos.filter(video => video.status === 'draft'),
    filteredVideos: (state) => {
      let filtered = state.videos;

      // Filter by status
      if (state.filters.status !== 'all') {
        filtered = filtered.filter(video => video.status === state.filters.status);
      }

      // Filter by recording type
      if (state.filters.recording_type !== 'all') {
        filtered = filtered.filter(video => video.recording_type === state.filters.recording_type);
      }

      // Filter by search
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        filtered = filtered.filter(video => 
          video.title.toLowerCase().includes(search) ||
          video.description?.toLowerCase().includes(search)
        );
      }

      return filtered;
    },
    totalDuration: (state) => state.videos.reduce((total, video) => total + (video.duration || 0), 0),
    totalViews: (state) => state.videos.reduce((total, video) => total + (video.views_count || 0), 0),
    averageQualityScore: (state) => {
      const videosWithScore = state.videos.filter(video => video.quality_score);
      if (videosWithScore.length === 0) return 0;
      return videosWithScore.reduce((sum, video) => sum + video.quality_score, 0) / videosWithScore.length;
    }
  },

  actions: {
    async fetchVideos(page = 1) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          page,
          status: this.filters.status !== 'all' ? this.filters.status : undefined,
          recording_type: this.filters.recording_type !== 'all' ? this.filters.recording_type : undefined,
          search: this.filters.search || undefined
        };

        const response = await axios.get('/api/videos', { params });
        
        if (response.data.success) {
          this.videos = response.data.data.data;
          this.pagination = {
            current_page: response.data.data.current_page,
            last_page: response.data.data.last_page,
            per_page: response.data.data.per_page,
            total: response.data.data.total
          };
        } else {
          throw new Error(response.data.message || 'Failed to fetch videos');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch videos';
        console.error('Error fetching videos:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchVideo(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/videos/${id}`);
        
        if (response.data.success) {
          this.currentVideo = response.data.data;
          return this.currentVideo;
        } else {
          throw new Error(response.data.message || 'Failed to fetch video');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch video';
        console.error('Error fetching video:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async uploadVideo(formData) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post('/api/videos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          // Add the new video to the beginning of the list
          this.videos.unshift(response.data.data);
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to upload video');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to upload video';
        console.error('Error uploading video:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateVideo(id, data) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.put(`/api/videos/${id}`, data);

        if (response.data.success) {
          // Update video in the list
          const index = this.videos.findIndex(video => video.id === id);
          if (index !== -1) {
            this.videos[index] = response.data.data;
          }
          
          // Update current video if it's the same
          if (this.currentVideo && this.currentVideo.id === id) {
            this.currentVideo = response.data.data;
          }
          
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to update video');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to update video';
        console.error('Error updating video:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteVideo(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.delete(`/api/videos/${id}`);

        if (response.data.success) {
          // Remove video from the list
          this.videos = this.videos.filter(video => video.id !== id);
          
          // Clear current video if it's the same
          if (this.currentVideo && this.currentVideo.id === id) {
            this.currentVideo = null;
          }
          
          return true;
        } else {
          throw new Error(response.data.message || 'Failed to delete video');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to delete video';
        console.error('Error deleting video:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getAiSuggestions(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/videos/${id}/ai-suggestions`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to get AI suggestions');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to get AI suggestions';
        console.error('Error getting AI suggestions:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async applyAiSuggestion(id, suggestionId, action) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post(`/api/videos/${id}/apply-ai-suggestion`, {
          suggestion_id: suggestionId,
          action: action
        });

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to apply AI suggestion');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to apply AI suggestion';
        console.error('Error applying AI suggestion:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getVideoAnalytics(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/videos/${id}/analytics`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to get video analytics');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to get video analytics';
        console.error('Error getting video analytics:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async incrementViews(id) {
      try {
        await axios.post(`/api/videos/${id}/increment-views`);
        
        // Update local state
        const video = this.videos.find(v => v.id === id);
        if (video) {
          video.views_count = (video.views_count || 0) + 1;
          video.last_viewed_at = new Date().toISOString();
        }
        
        if (this.currentVideo && this.currentVideo.id === id) {
          this.currentVideo.views_count = (this.currentVideo.views_count || 0) + 1;
          this.currentVideo.last_viewed_at = new Date().toISOString();
        }
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    },

    async incrementDownloads(id) {
      try {
        await axios.post(`/api/videos/${id}/increment-downloads`);
        
        // Update local state
        const video = this.videos.find(v => v.id === id);
        if (video) {
          video.downloads_count = (video.downloads_count || 0) + 1;
        }
        
        if (this.currentVideo && this.currentVideo.id === id) {
          this.currentVideo.downloads_count = (this.currentVideo.downloads_count || 0) + 1;
        }
      } catch (error) {
        console.error('Error incrementing downloads:', error);
      }
    },

    async incrementShares(id) {
      try {
        await axios.post(`/api/videos/${id}/increment-shares`);
        
        // Update local state
        const video = this.videos.find(v => v.id === id);
        if (video) {
          video.shares_count = (video.shares_count || 0) + 1;
        }
        
        if (this.currentVideo && this.currentVideo.id === id) {
          this.currentVideo.shares_count = (this.currentVideo.shares_count || 0) + 1;
        }
      } catch (error) {
        console.error('Error incrementing shares:', error);
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
    },

    clearError() {
      this.error = null;
    },

    setCurrentVideo(video) {
      this.currentVideo = video;
    }
  }
});
