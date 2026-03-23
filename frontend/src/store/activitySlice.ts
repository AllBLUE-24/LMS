import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// This slice is now simplified. It no longer handles async data fetching,
// as that is now the responsibility of the central apiSlice.
// It can be used for UI state related to the activity timeline.

interface ActivityUIState {
  // Example of UI state: you could store a filter for activity types
  activityTypeFilter: string | null;
}

const initialState: ActivityUIState = {
  activityTypeFilter: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    // Example reducer for UI state
    setActivityTypeFilter: (state, action: Payload.Action<string | null>) => {
      state.activityTypeFilter = action.payload;
    },
  },
  // The extraReducers and createAsyncThunk have been removed.
});

export const { setActivityTypeFilter } = activitySlice.actions;
export default activitySlice.reducer;