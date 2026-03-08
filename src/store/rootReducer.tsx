import { combineReducers } from 'redux'
import { loadingScreenReducer } from './reducers/loading-screen'
import { appSettingReducer } from './reducers/app-setting'
import { socketReducer } from './reducers/socket'
import { userDataReducer } from './reducers/user-data'

const rootReducer = combineReducers({
  loadingScreenReducer,
  appSettingReducer,
  socketReducer,
  userDataReducer
})
export default rootReducer
