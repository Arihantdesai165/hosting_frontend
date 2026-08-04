import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  globalLoading: boolean;
  activeRequests: number;
}

const initialState: UiState = {
  globalLoading: false,
  activeRequests: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    startLoading(state) {
      state.activeRequests += 1;
      state.globalLoading = true;
    },
    stopLoading(state) {
      state.activeRequests = Math.max(0, state.activeRequests - 1);
      if (state.activeRequests === 0) {
        state.globalLoading = false;
      }
    },
    resetLoading(state) {
      state.activeRequests = 0;
      state.globalLoading = false;
    },
  },
});

export const { startLoading, stopLoading, resetLoading } = uiSlice.actions;
export default uiSlice.reducer;
