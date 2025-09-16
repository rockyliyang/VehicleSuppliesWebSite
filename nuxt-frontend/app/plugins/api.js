import { defineNuxtPlugin } from '#app'
import api from '~/utils/api.js'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      api
    }
  }
})