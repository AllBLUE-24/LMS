
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
  modalType: string | null;
  modalProps: any;
}

const initialState: ModalState = {
  modalType: null,
  modalProps: {},
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<{ modalType: string; modalProps?: any }>) => {
      state.modalType = action.payload.modalType;
      state.modalProps = action.payload.modalProps || {};
    },
    closeModal: (state) => {
      state.modalType = null;
      state.modalProps = {};
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
