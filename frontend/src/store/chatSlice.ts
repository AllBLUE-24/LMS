import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '@/types';

// This slice is now simplified. It no longer handles async data fetching.
// It is responsible for UI state, such as tracking the currently selected
// conversation and handling real-time message additions from a WebSocket.

interface ChatUIState {
  selectedConversationId: string | null;
  // Messages for the selected conversation could be stored here,
  // especially if you have a WebSocket pushing real-time updates.
  messages: Message[]; 
}

const initialState: ChatUIState = {
  selectedConversationId: null,
  messages: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    selectConversation: (state, action: PayloadAction<string | null>) => {
      state.selectedConversationId = action.payload;
      // Clear messages when switching conversations
      state.messages = []; 
    },
    // Reducer to add a new message (e.g., from a WebSocket)
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.messages.findIndex(msg => msg.id === action.payload.id) === -1) {
        state.messages.push(action.payload);
      }
    },
    clearChatState: () => initialState,
  },
});

export const { selectConversation, addMessage, clearChatState } = chatSlice.actions;

export default chatSlice.reducer;
