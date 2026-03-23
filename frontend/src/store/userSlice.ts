import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// This slice is now simplified. It no longer handles async data fetching,
// as that is now the responsibility of the central apiSlice.
// It can be used for UI state, such as storing the ID of a user
// being edited, or other client-side state related to users.

interface UsersUIState {
  // Example of UI state: you could store the ID of a user being edited
  editingUserId: string | null;
}

const initialState: UsersUIState = {
  editingUserId: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Example reducer for UI state
    setEditingUser: (state, action: PayloadAction<string | null>) => {
      state.editingUserId = action.payload;
    },
  },
  // The extraReducers and createAsyncThunk for fetchUsers have been removed.
});

export const { setEditingUser } = userSlice.actions;
export default userSlice.reducer;
