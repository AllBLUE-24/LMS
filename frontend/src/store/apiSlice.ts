// src/store/apiSlice.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import { apiClient } from '@/lib/apiClient';
import { Lead } from '@/app/(main)/leads/columns'; // Assuming you have this type defined

// --- Official RTK Query axiosBaseQuery for JSON ---
const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string
      method: AxiosRequestConfig['method']
      data?: AxiosRequestConfig['data']
      params?: AxiosRequestConfig['params']
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params }) => {
    try {
      const result = await apiClient({ url, method, data, params })
      return { data: result.data }
    } catch (axiosError) {
      const err = axiosError as AxiosError
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      }
    }
  }

// --- Specialized baseQuery for FormData ---
const axiosBaseQueryWithFormData =
  (): BaseQueryFn<
    {
      url: string
      method: AxiosRequestConfig['method']
      data?: AxiosRequestConfig['data']
      params?: AxiosRequestConfig['params']
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params }) => {
    try {
      const result = await apiClient({
        url,
        method,
        data,
        params,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return { data: result.data }
    } catch (axiosError) {
      const err = axiosError as AxiosError
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      }
    }
  }

// Define a service using a base query and expected endpoints.
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Dashboard', 'Leads', 'Tasks', 'Users', 'Notifications', 'Activities', 'Chat'],
  endpoints: (builder) => ({
    // --- Dashboard Endpoints ---
    getDashboardStats: builder.query<any, { from?: string; to?: string }>({
      query: (params) => ({ url: 'api/v1/dashboard/stats', method: 'get', params }),
      providesTags: ['Dashboard'],
    }),

    // --- Leads Endpoints ---
    getMyEnquiries: builder.query<any, void>({
      query: () => ({ url: 'api/v1/leads/my-leads', method: 'get' }),
      providesTags: (result) =>
        result && result.leads
          ? [...result.leads.map(({ id }) => ({ type: 'Leads' as const, id })), { type: 'Leads', id: 'LIST' }]
          : [{ type: 'Leads', id: 'LIST' }],
    }),

    getGeneratedLeads: builder.query<any, void>({
      query: () => ({ url: 'api/v1/leads/generated-leads', method: 'get' }),
      providesTags: (result) =>
        result && result.leads
          ? [...result.leads.map(({ id }) => ({ type: 'Leads' as const, id })), { type: 'Leads', id: 'LIST' }]
          : [{ type: 'Leads', id: 'LIST' }],
    }),

    getLead: builder.query<any, string>({
      query: (id) => ({ url: `api/v1/leads/${id}`, method: 'get' }),
      providesTags: (result, error, id) => [{ type: 'Leads', id }],
    }),

    createLead: builder.mutation<any, any>({
      query: (newLead) => ({
        url: 'api/v1/leads',
        method: 'post',
        data: newLead,
      }),
      invalidatesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
    updateLead: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...patch }) => ({
        url: `api/v1/leads/${id}/status`,
        method: 'put',
        data: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Leads', id }],
    }),
    deleteLead: builder.mutation<any, string>({
      query: (id) => ({
        url: `api/v1/leads/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Leads', id }],
    }),
    bulkAssignLeads: builder.mutation<any, { leadIds: string[]; agentId: string }>({
        query: (assignment) => ({
            url: 'api/v1/leads/bulk-assign',
            method: 'post',
            data: assignment,
        }),
        invalidatesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
     getNurturingQueue: builder.query<Lead[], void>({
        query: () => ({ url: 'api/v1/leads/nurturing-queue', method: 'get' }),
        providesTags: (result) =>
            result
                ? [...result.map(({ id }) => ({ type: 'Leads' as const, id })), { type: 'Leads', id: 'QUEUE' }]
                : [{ type: 'Leads', id: 'QUEUE' }],
    }),
    scheduleFollowUp: builder.mutation<any, { leadId: string; next_call_date: string; reason: string; note?: string }>({
        query: ({ leadId, ...body }) => ({
            url: `api/v1/leads/${leadId}/schedule-follow-up`,
            method: 'post',
            data: body,
        }),
        invalidatesTags: (result, error, { leadId }) => [{ type: 'Leads', id: 'QUEUE' }, { type: 'Leads', id: leadId }],
    }),
    
    // --- NEW: Mutation for Nurturers to assign to Closers ---
    assignToCloser: builder.mutation<any, { leadId: string; agentId: string }>({
        query: ({ leadId, agentId }) => ({
            url: `api/v1/leads/${leadId}/assign-to-closer`,
            method: 'post',
            data: { agentId }, // The request body
        }),
        // After assigning, refresh the nurturing queue and the specific lead's data
        invalidatesTags: (result, error, { leadId }) => [{ type: 'Leads', id: 'QUEUE' }, { type: 'Leads', id: leadId }],
    }),

    qualifyLead: builder.mutation<any, { leadId: string; [key: string]: any }>({
        query: ({ leadId, ...body }) => ({
            url: `api/v1/leads/${leadId}/qualify`,
            method: 'put',
            data: body,
        }),
        invalidatesTags: (result, error, { leadId }) => [{ type: 'Leads', id: 'QUEUE' }, { type: 'Leads', id: leadId }],
    }),

    scheduleMeeting: builder.mutation<any, { leadId: string; meetingTime: string; location: string; notes?: string }>({
        query: ({ leadId, ...body }) => ({
            url: `api/v1/leads/${leadId}/schedule-meeting`,
            method: 'post',
            data: body,
        }),
        invalidatesTags: (result, error, { leadId }) => [{ type: 'Leads', id: 'QUEUE' }, { type: 'Leads', id: leadId }],
    }),

    closeLead: builder.mutation<any, { leadId: string; [key: string]: any }>({
        query: ({ leadId, ...body }) => ({
            url: `api/v1/leads/${leadId}/close`,
            method: 'put',
            data: body,
        }),
        invalidatesTags: (result, error, { leadId }) => [{ type: 'Leads', id: 'QUEUE' }, { type: 'Leads', id: leadId }],
    }),

    getClosedWonLeads: builder.query<Lead[], void>({
        query: () => ({ url: 'api/v1/leads/closed-won', method: 'get' }),
        providesTags: (result) =>
            result
                ? [...result.map(({ id }) => ({ type: 'Leads' as const, id })), { type: 'Leads', id: 'LIST' }]
                : [{ type: 'Leads', id: 'LIST' }],
    }),

    // --- Tasks Endpoints ---
    getTasks: builder.query<any[], void>({
      query: () => ({ url: 'api/v1/tasks', method: 'get' }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Tasks' as const, id })), { type: 'Tasks', id: 'LIST' }]
          : [{ type: 'Tasks', id: 'LIST' }],
    }),
    getTasksForLead: builder.query<any[], string>({
        query: (leadId) => ({ url: `api/v1/leads/${leadId}/tasks`, method: 'get' }),
        providesTags: (result, error, leadId) => [{ type: 'Tasks', id: leadId }],
    }),
    createTask: builder.mutation<any, any>({
      query: (newTask) => ({
        url: 'api/v1/tasks',
        method: 'post',
        data: newTask,
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }],
    }),
    updateTask: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...patch }) => ({
        url: `api/v1/tasks/${id}`,
        method: 'put',
        data: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Tasks', id }],
    }),
    deleteTask: builder.mutation<any, string>({
      query: (id) => ({
        url: `api/v1/tasks/${id}`,
        method: 'delete',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Tasks', id }],
    }),

    // --- Users Endpoints ---
    getUsers: builder.query<any[], void>({
      query: () => ({ url: 'api/v1/users', method: 'get' }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Users' as const, id })), { type: 'Users', id: 'LIST' }]
          : [{ type: 'Users', id: 'LIST' }],
    }),
    getUser: builder.query<any, string>({
      query: (id) => ({ url: `api/v1/users/${id}`, method: 'get' }),
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    inviteUser: builder.mutation<any, any>({
      query: (newUser) => ({
        url: 'api/v1/users/invite',
        method: 'post',
        data: newUser,
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUser: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...patch }) => ({
        url: `api/v1/users/${id}`,
        method: 'put',
        data: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Users', id }, { type: 'Users', id: 'LIST' }],
    }),
    updateUserCapabilities: builder.mutation<any, { id: string; capabilities: string[] }>({
        query: ({ id, capabilities }) => ({
            url: `api/v1/users/${id}/capabilities`,
            method: 'put',
            data: { capabilities },
        }),
        invalidatesTags: (result, error, { id }) => [{ type: 'Users', id }, { type: 'Users', id: 'LIST' }],
    }),
    getClosers: builder.query<any[], void>({
        query: () => ({ url: 'api/v1/users/closers', method: 'get' }),
        providesTags: (result) =>
            result
                ? [...result.map(({ id }) => ({ type: 'Users' as const, id })), { type: 'Users', id: 'LIST' }]
                : [{ type: 'Users', id: 'LIST' }],
    }),
    getNurturers: builder.query<any[], void>({
        query: () => ({ url: 'api/v1/users/nurturers', method: 'get' }),
        providesTags: (result) =>
            result
                ? [...result.map(({ id }) => ({ type: 'Users' as const, id })), { type: 'Users', id: 'LIST' }]
                : [{ type: 'Users', id: 'LIST' }],
    }),
    addManualLead: builder.mutation<any, any>({
        query: (newLead) => ({
            url: 'api/v1/leads/add-manual',
            method: 'post',
            data: newLead,
        }),
        invalidatesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
    uploadLeadsFile: builder.mutation<any, FormData>({
        query: (formData) => ({
            url: 'api/v1/leads/upload-file',
            method: 'post',
            data: formData,
        }),
        invalidatesTags: [{ type: 'Leads', id: 'LIST' }],
    }),

    getUsersByCapability: builder.query<any[], string>({
      query: (capability) => ({
          url: 'api/v1/users',
          method: 'get',
          params: { capability }, // This will make a request like /api/v1/users?capability=can_nurture_leads
      }),
      providesTags: (result) =>
          result
              ? [...result.map(({ id }) => ({ type: 'Users' as const, id })), { type: 'Users', id: 'LIST' }]
              : [{ type: 'Users', id: 'LIST' }],
    }),
    // --- Notifications Endpoints ---
    getNotifications: builder.query<any[], void>({
        query: () => ({ url: 'api/v1/notifications', method: 'get' }),
        providesTags: (result) =>
            result
                ? [...result.map(({ id }) => ({ type: 'Notifications' as const, id })), { type: 'Notifications', id: 'LIST' }]
                : [{ type: 'Notifications', id: 'LIST' }],
    }),
    markNotificationAsRead: builder.mutation<any, string>({
        query: (id) => ({
            url: `api/v1/notifications/${id}/read`,
            method: 'put',
        }),
        invalidatesTags: (result, error, id) => [{ type: 'Notifications', id }, { type: 'Notifications', id: 'LIST' }],
    }),

    // --- Activities Endpoints ---
    getLeadActivities: builder.query<any[], string>({
        query: (leadId) => ({
            url: 'api/v1/activities',
            method: 'get',
            params: { lead_id: leadId },
        }),
        providesTags: (result, error, leadId) => [{ type: 'Activities', id: leadId }],
    }),
    createLeadActivity: builder.mutation<any, { leadId: string; activityData: any }>({
        query: ({ leadId, activityData }) => ({
            url: 'api/v1/activities',
            method: 'post',
            data: { ...activityData, lead_id: leadId },
        }),
        invalidatesTags: (result, error, { leadId }) => [{ type: 'Activities', id: leadId }],
    }),
    updateLeadActivity: builder.mutation<any, { leadId: string; activityId: string; activityData: any }>({
        query: ({ activityId, activityData }) => ({
            url: `api/v1/activities/${activityId}`,
            method: 'put',
            data: activityData,
        }),
        invalidatesTags: (result, error, { leadId }) => [{ type: 'Activities', id: leadId }],
    }),
    deleteLeadActivity: builder.mutation<any, { leadId: string; activityId: string }>({
        query: ({ activityId }) => ({
            url: `api/v1/activities/${activityId}`,
            method: 'delete',
        }),
        invalidatesTags: (result, error, { leadId }) => [{ type: 'Activities', id: leadId }],
    }),

    // --- Chat Endpoints ---
    getConversations: builder.query<any[], void>({
        query: () => ({ url: 'api/v1/chat/conversations', method: 'get' }),
        providesTags: (result) =>
            result
                ? [...result.map(({ id }) => ({ type: 'Chat' as const, id })), { type: 'Chat', id: 'LIST' }]
                : [{ type: 'Chat', id: 'LIST' }],
    }),
    getMessages: builder.query<any[], string>({
        query: (conversationId) => ({ url: `api/v1/chat/conversations/${conversationId}/messages`, method: 'get' }),
        providesTags: (result, error, conversationId) => [{ type: 'Chat', id: conversationId }],
    }),
    startConversation: builder.mutation<any, string>({
        query: (targetUserId) => ({
            url: 'api/v1/chat/conversations',
            method: 'post',
            data: { target_user_id: targetUserId },
        }),
        invalidatesTags: [{ type: 'Chat', id: 'LIST' }],
    }),
    sendMessage: builder.mutation<any, { conversationId: string; content: string }>({
        query: ({ conversationId, content }) => ({
            url: `api/v1/chat/conversations/${conversationId}/messages`,
            method: 'post',
            data: { content },
        }),
        invalidatesTags: (result, error, { conversationId }) => [{ type: 'Chat', id: conversationId }],
    }),

    // --- Admin Endpoints ---
    getAdminDashboardStats: builder.query<any, void>({
        query: () => ({ url: 'api/v1/leads/admin/dashboard-stats', method: 'get' }),
        providesTags: ['Dashboard'],
    }),
      
    }),
  
});

// Export hooks for usage in functional components
export const { 
    useGetDashboardStatsQuery,
    useGetMyEnquiriesQuery,
    useGetGeneratedLeadsQuery,
    useCreateLeadMutation,
    useUpdateLeadMutation,
    useDeleteLeadMutation,
    useBulkAssignLeadsMutation,
    useGetTasksQuery,
    useGetTasksForLeadQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useGetUsersQuery,
    useGetUserQuery,
    useGetLeadQuery,
    useInviteUserMutation,
    useUpdateUserMutation,
    useUpdateUserCapabilitiesMutation,
    useGetClosersQuery,
    useGetNurturersQuery,
    useAddManualLeadMutation,
    useUploadLeadsFileMutation,
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useGetLeadActivitiesQuery,
    useCreateLeadActivityMutation,
    useUpdateLeadActivityMutation,
    useDeleteLeadActivityMutation,
    useGetConversationsQuery,
    useGetMessagesQuery,
    useStartConversationMutation,
    useSendMessageMutation,
    useGetAdminDashboardStatsQuery,
    useGetNurturingQueueQuery,
    useScheduleFollowUpMutation,
    useAssignToCloserMutation,
    useQualifyLeadMutation,
    useScheduleMeetingMutation,
    useCloseLeadMutation,
    useGetClosedWonLeadsQuery,
    useGetUsersByCapabilityQuery,
} = apiSlice;