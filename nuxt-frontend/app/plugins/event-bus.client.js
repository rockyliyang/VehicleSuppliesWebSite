import { defineNuxtPlugin } from '#app'
import mitt from 'mitt'

export default defineNuxtPlugin(() => {
  const emitter = mitt()
  
  return {
    provide: {
      bus: emitter
    }
  }
})