import { useEffect } from 'react'

/**
 * Custom hook to refresh data when user logs in
 * @param refreshCallback - Function to call when user logs in
 */
export const useRefreshOnLogin = (refreshCallback: () => void) => {
  useEffect(() => {
    const handleLoginSuccess = () => {
      refreshCallback()
    }

    globalThis.addEventListener('user-logged-in', handleLoginSuccess)

    return () => {
      globalThis.removeEventListener('user-logged-in', handleLoginSuccess)
    }
  }, [refreshCallback])
}

export default useRefreshOnLogin
