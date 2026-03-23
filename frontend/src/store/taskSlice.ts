
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// This slice is now simplified. It no longer handles async data fetching,
// as that is now the responsibility of the central apiSlice.
// It can be used for UI state, such as storing filters or search terms
// related to the tasks feature.

interface TasksUIState {
  // Example of UI state: you could store a search query
  searchQuery: string;
}

const initialState: TasksUIState = {
  searchQuery: '',
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Example reducer for UI state
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
  // The extraReducers and createAsyncThunk for fetchTasks have been removed.
});

export const { setSearchQuery } = taskSlice.actions;
export default taskSlice.reducer;
