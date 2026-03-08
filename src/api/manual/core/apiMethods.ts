import { AxiosInstance } from 'axios'
import { ApiType } from '@/types/api/ApiType'

const encodeURI = (req: ApiType) => {
  const enCodeURI = encodeURIComponent(req.url).replace(/%2F/gi, '/')
  return `${enCodeURI}`
}

const apiMethods = (axiosInstance: AxiosInstance) => ({
  async get(req: ApiType) {
    const res = await axiosInstance.get(encodeURI(req), req.config)
    return res?.data
  },

  async post(req: { data?: any } & ApiType) {
    const res = await axiosInstance.post(encodeURI(req), req.data, req.config)
    return res?.data
  },

  async put(req: { data?: any } & ApiType) {
    const res = await axiosInstance.put(encodeURI(req), req.data, req.config)
    return res?.data
  },

  async patch(req: { data?: any } & ApiType) {
    const res = await axiosInstance.patch(encodeURI(req), req.data, req.config)
    return res?.data
  },

  async delete(req: ApiType) {
    const res = await axiosInstance.delete(encodeURI(req), req.config)
    return res?.data
  }
})

export default apiMethods
