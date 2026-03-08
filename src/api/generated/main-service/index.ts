import { Api } from './apiGenerated'
import Cookies from 'js-cookie'

const mainService = new Api({
  baseURL: process.env.NEXT_PUBLIC_SERVICE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Setup request interceptor
mainService.instance.interceptors.request.use(
  async config => {
    const token = Cookies.get('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Setup response interceptor
mainService.instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // // Handle specific error cases like token expiration
    // if (error.response.status === 401 && !originalRequest._retry) {
    //   originalRequest._retry = true

    //   const refreshToken = Cookies.get('refreshToken')
    //   if (refreshToken) {
    //     // Call an endpoint to refresh the token
    //     const newTokenResponse = await mainService.auth.refreshToken(refreshToken)
    //     const newtoken = newTokenResponse.data.token
    //     Cookies.set('token', newtoken)

    //     // Update the Authorization header and retry the original request
    //     originalRequest.headers.Authorization = `Bearer ${newtoken}`
    //     return mainService.instance(originalRequest)
    //   }
    // }
    return Promise.reject(error)
  }
)

export { mainService }
