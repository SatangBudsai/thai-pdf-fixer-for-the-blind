import { mainService } from '@/api/manual/configs/main-service'

const exampleMainService = {
  getExample() {
    return mainService.get({ url: `/example` })
  }
}

export default exampleMainService
