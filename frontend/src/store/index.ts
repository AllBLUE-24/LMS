
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import { fileApiSlice } from './fileApiSlice'; // <-- Import the new fileApiSlice
import taskReducer from './taskSlice';
import modalReducer from './modalSlice';
import leadReducer from './leadSlice';
import userReducer from './userSlice';
import activityReducer from './activitySlice';
import notificationReducer from './notificationSlice';
import chatReducer from './chatSlice';

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [fileApiSlice.reducerPath]: fileApiSlice.reducer, // <-- Add the fileApi reducer
    tasks: taskReducer,
    modal: modalReducer,
    leads: leadReducer,
    users: userReducer,
    activities: activityReducer,
    notifications: notificationReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, fileApiSlice.middleware), // <-- Add the fileApi middleware
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
