// src/store/fileApiSlice.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import { apiClient } from '@/lib/apiClient';

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

export const fileApiSlice = createApi({
  reducerPath: 'fileApi',
  baseQuery: axiosBaseQueryWithFormData(),
  tagTypes: ['Leads'], // Keep tags consistent
  endpoints: (builder) => ({
    uploadLeadsFile: builder.mutation<any, FormData>({
        query: (formData) => ({
            url: 'api/v1/leads/upload-file',
            method: 'post',
            data: formData,
        }),
        invalidatesTags: [{ type: 'Leads', id: 'LIST' }],
    }),
  }),
});

export const { useUploadLeadsFileMutation } = fileApiSlice;
