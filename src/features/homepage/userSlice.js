import { createSlice } from '@reduxjs/toolkit';

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: undefined,
  },
  reducers: {
    setUser: (state, action) => {
      // alert(action.payload);
      console.log("set user", action.payload);
      state.user = action.payload;
    },
  },
});

export const { setUser } = userSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.user.value)`
export const selectUser = state => state.user.user;

export default userSlice.reducer;
