import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';

const notificationsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.timestamp.localeCompare(a.timestamp),
});

const initialState = notificationsAdapter.getInitialState();

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      apiSlice.endpoints.getNotifications.matchFulfilled,
      (state, { payload }) => {
        notificationsAdapter.setAll(state, payload);
      }
    );
  },
});

export default notificationSlice.reducer;

export const {
  selectAll: selectAllNotifications,
  selectById: selectNotificationById,
} = notificationsAdapter.getSelectors((state) => state.notifications);