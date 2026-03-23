
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssignedLead } from '@/app/(main)/my-enquiries/columns';

// This slice is now simplified. It no longer handles async data fetching,
// as that is now the responsibility of the central apiSlice.
// It can be used for UI state, such as storing the currently selected lead,
// filters, or other client-side state related to the leads feature.

interface LeadsState {
  // Example of UI state: you could store the ID of a selected lead
  selectedLeadId: string | null;
}

const initialState: LeadsState = {
  selectedLeadId: null,
};

const leadSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    // Example reducer for UI state
    setSelectedLead: (state, action: PayloadAction<string | null>) => {
      state.selectedLeadId = action.payload;
    },
  },
  // The extraReducers and createAsyncThunk for fetchLeads have been removed.
});

export const { setSelectedLead } = leadSlice.actions;
export default leadSlice.reducer;
