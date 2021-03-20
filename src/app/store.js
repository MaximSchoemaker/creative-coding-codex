import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counterSlice';
import userReducer from '../features/homepage/userSlice';
import entriesReducer from '../features/homepage/entriesSlice';


export default configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    entries: entriesReducer,
  },
});
