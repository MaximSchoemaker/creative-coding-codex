import { createSlice } from '@reduxjs/toolkit';

export const entriesSlice = createSlice({
  name: 'entries',
  initialState: {
    entries: [],
  },
  reducers: {
    setEntries: (state, action) => {
      console.log("set entries", action);
      state.entries = action.payload;
    },
    setEntry: (state, action) => {
      console.log("set entry", action.payload);
      const entry = action.payload;

      const index = state.entries.findIndex(e => e._id === entry._id);
      state.entries[index] = entry;
    },
    setComments: (state, action) => {
      console.log("set comments", action.payload);
      const { entryId, comments } = action.payload;

      const entry = state.entries.find(e => e._id === entryId);
      entry.comments = comments;
    }
  },
});

export const { setEntries, setComments, setEntry } = entriesSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.Entries.value)`
export const selectEntries = state => state.entries.entries;

export default entriesSlice.reducer;
