import { useSelector } from 'react-redux'
import { useAuthModal } from '@/components/auth'
import { StateType } from '@/store'

const useLogin = () => {
  const userDataReducer = useSelector((state: StateType) => state.userDataReducer)
  const { openModal } = useAuthModal()

  const require = (nextStep?: () => void) => {
    if (userDataReducer.isLoggedIn) {
      if (nextStep) {
        nextStep()
      }
      return true
    }

    openModal('login', nextStep)
    return false
  }

  return {
    require
  }
}

export default useLogin
