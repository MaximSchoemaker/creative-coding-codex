import { createSlice } from '@reduxjs/toolkit';

export const entriesSlice = createSlice({
  name: 'entries',
  initialState: {
    entries: [],
  },
  reducers: {
    setEntries: (state, action) => {
      console.log("set entries", action.payload);
      state.entries = action.payload;
    },
  },
});

export const { setEntries } = entriesSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.Entries.value)`
export const selectEntries = state => state.entries.entries;

export default entriesSlice.reducer;
