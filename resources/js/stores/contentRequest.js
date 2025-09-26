import { defineStore } from 'pinia';
import axios from 'axios';

export const useContentRequestStore = defineStore('contentRequest', {
  state: () => ({
    contentRequests: [],
    currentRequest: null,
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
      type: 'all',
      search: ''
    }
  }),

  getters: {
    activeRequests: (state) => state.contentRequests.filter(request => request.status === 'active'),
    completedRequests: (state) => state.contentRequests.filter(request => request.status === 'completed'),
    overdueRequests: (state) => state.contentRequests.filter(request => 
      request.deadline && new Date(request.deadline) < new Date() && request.status !== 'completed'
    ),
    filteredRequests: (state) => {
      let filtered = state.contentRequests;

      // Filter by status
      if (state.filters.status !== 'all') {
        filtered = filtered.filter(request => request.status === state.filters.status);
      }

      // Filter by type
      if (state.filters.type !== 'all') {
        filtered = filtered.filter(request => request.type === state.filters.type);
      }

      // Filter by search
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        filtered = filtered.filter(request => 
          request.title.toLowerCase().includes(search) ||
          request.description?.toLowerCase().includes(search)
        );
      }

      return filtered;
    },
    totalRequests: (state) => state.contentRequests.length,
    totalVideos: (state) => state.contentRequests.reduce((total, request) => total + request.videos?.length || 0, 0),
    averageCompletionRate: (state) => {
      if (state.contentRequests.length === 0) return 0;
      return state.contentRequests.reduce((sum, request) => sum + (request.completion_percentage || 0), 0) / state.contentRequests.length;
    }
  },

  actions: {
    async fetchContentRequests(page = 1) {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          page,
          status: this.filters.status !== 'all' ? this.filters.status : undefined,
          type: this.filters.type !== 'all' ? this.filters.type : undefined,
          search: this.filters.search || undefined
        };

        const response = await axios.get('/api/content-requests', { params });
        
        if (response.data.success) {
          this.contentRequests = response.data.data.data;
          this.pagination = {
            current_page: response.data.data.current_page,
            last_page: response.data.data.last_page,
            per_page: response.data.data.per_page,
            total: response.data.data.total
          };
        } else {
          throw new Error(response.data.message || 'Failed to fetch content requests');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch content requests';
        console.error('Error fetching content requests:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchContentRequest(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/content-requests/${id}`);
        
        if (response.data.success) {
          this.currentRequest = response.data.data;
          return this.currentRequest;
        } else {
          throw new Error(response.data.message || 'Failed to fetch content request');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch content request';
        console.error('Error fetching content request:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createContentRequest(data) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post('/api/content-requests', data);

        if (response.data.success) {
          // Add the new request to the beginning of the list
          this.contentRequests.unshift(response.data.data);
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to create content request');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to create content request';
        console.error('Error creating content request:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateContentRequest(id, data) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.put(`/api/content-requests/${id}`, data);

        if (response.data.success) {
          // Update request in the list
          const index = this.contentRequests.findIndex(request => request.id === id);
          if (index !== -1) {
            this.contentRequests[index] = response.data.data;
          }
          
          // Update current request if it's the same
          if (this.currentRequest && this.currentRequest.id === id) {
            this.currentRequest = response.data.data;
          }
          
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to update content request');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to update content request';
        console.error('Error updating content request:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteContentRequest(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.delete(`/api/content-requests/${id}`);

        if (response.data.success) {
          // Remove request from the list
          this.contentRequests = this.contentRequests.filter(request => request.id !== id);
          
          // Clear current request if it's the same
          if (this.currentRequest && this.currentRequest.id === id) {
            this.currentRequest = null;
          }
          
          return true;
        } else {
          throw new Error(response.data.message || 'Failed to delete content request');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to delete content request';
        console.error('Error deleting content request:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loadByInviteToken(token) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/content-requests/invite/${token}`);
        
        if (response.data.success) {
          this.currentRequest = response.data.data;
          return this.currentRequest;
        } else {
          throw new Error(response.data.message || 'Failed to load content request');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to load content request';
        console.error('Error loading content request by token:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async submitVideo(requestId, videoId, inviteeToken) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post(`/api/content-requests/${requestId}/submit-video`, {
          video_id: videoId,
          invitee_token: inviteeToken
        });

        if (response.data.success) {
          // Update the current request if it's the same
          if (this.currentRequest && this.currentRequest.id === requestId) {
            await this.fetchContentRequest(requestId);
          }
          
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to submit video');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to submit video';
        console.error('Error submitting video:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async getContentRequestAnalytics(id) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(`/api/content-requests/${id}/analytics`);

        if (response.data.success) {
          return response.data.data;
        } else {
          throw new Error(response.data.message || 'Failed to get content request analytics');
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Failed to get content request analytics';
        console.error('Error getting content request analytics:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async pauseContentRequest(id) {
      return this.updateContentRequest(id, { status: 'paused' });
    },

    async resumeContentRequest(id) {
      return this.updateContentRequest(id, { status: 'active' });
    },

    async completeContentRequest(id) {
      return this.updateContentRequest(id, { status: 'completed' });
    },

    async cancelContentRequest(id) {
      return this.updateContentRequest(id, { status: 'cancelled' });
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters };
    },

    clearError() {
      this.error = null;
    },

    setCurrentRequest(request) {
      this.currentRequest = request;
    }
  }
});
