import { PayloadAction, createSlice } from '@reduxjs/toolkit'

type Props = {
  id: string | null
  email: string | null
  name: string | null
  avatar: string | null
  isLoggedIn: boolean
}

const initialState: Props = {
  id: null,
  email: null,
  name: null,
  avatar: null,
  isLoggedIn: false
}

const userDataSlice = createSlice({
  name: 'userDataSlice',
  initialState,
  reducers: {
    updateState: (state, action: PayloadAction<Partial<Props>>) => ({
      ...state,
      ...action.payload
    }),
    resetState: () => initialState
  }
})

export const userDataAction = userDataSlice.actions
export const userDataReducer = userDataSlice.reducer
