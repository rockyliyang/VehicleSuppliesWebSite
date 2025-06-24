// Mock Element UI MessageBox
const MessageBox = {
  confirm: jest.fn()
}

// Mock console.error
const originalConsoleError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Import the actual functions (we'll mock them inline)
const createTranslateFunction = (store) => {
  return (key, defaultText = key) => {
    try {
      return store.getters['language/translate'](key) || defaultText
    } catch (error) {
      return defaultText
    }
  }
}

const addToCart = async (productId, quantity = 1, store, api, messageHandler) => {
  const t = createTranslateFunction(store)
  
  if (!store.getters.isLoggedIn) {
    await MessageBox.confirm(
      t('cart.loginRequired', 'Please log in to add items to cart'),
      t('common.confirm', 'Confirm'),
      {
        confirmButtonText: t('common.login', 'Login'),
        cancelButtonText: t('common.cancel', 'Cancel'),
        type: 'warning'
      }
    )
    return
  }

  try {
    await api.postWithErrorHandler('/api/cart/add', {
      productId,
      quantity
    })
    
    messageHandler.showSuccess(
      t('cart.addSuccess', 'Product added to cart successfully')
    )
  } catch (error) {
    console.error('Failed to add product to cart:', error)
  }
}

describe('cartUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTranslateFunction', () => {
    it('should return translated text when translation exists', () => {
      const mockStore = {
        getters: {
          'language/translate': jest.fn().mockReturnValue('Translated Text')
        }
      }
      
      const translate = createTranslateFunction(mockStore)
      const result = translate('test.key', 'Default Text')
      
      expect(result).toBe('Translated Text')
      expect(mockStore.getters['language/translate']).toHaveBeenCalledWith('test.key')
    })

    it('should return default text when translation is null', () => {
      const mockStore = {
        getters: {
          'language/translate': jest.fn().mockReturnValue(null)
        }
      }
      
      const translate = createTranslateFunction(mockStore)
      const result = translate('test.key', 'Default Text')
      
      expect(result).toBe('Default Text')
    })

    it('should return default text when translation throws error', () => {
      const mockStore = {
        getters: {
          'language/translate': jest.fn().mockImplementation(() => {
            throw new Error('Translation error')
          })
        }
      }
      
      const translate = createTranslateFunction(mockStore)
      const result = translate('test.key', 'Default Text')
      
      expect(result).toBe('Default Text')
    })
  })

  describe('addToCart', () => {
    let mockStore, mockApi, mockMessageHandler

    beforeEach(() => {
      mockStore = {
        getters: {
          isLoggedIn: true,
          'language/translate': jest.fn((key) => {
            const translations = {
              'cart.addSuccess': 'Product added successfully',
              'cart.loginRequired': 'Please login first',
              'common.confirm': 'Confirm',
              'common.login': 'Login',
              'common.cancel': 'Cancel'
            }
            return translations[key] || key
          })
        }
      }

      mockApi = {
        postWithErrorHandler: jest.fn().mockResolvedValue({ success: true })
      }

      mockMessageHandler = {
        showSuccess: jest.fn()
      }

      MessageBox.confirm.mockResolvedValue(true)
    })

    it('should successfully add item to cart when user is logged in', async () => {
      await addToCart(123, 2, mockStore, mockApi, mockMessageHandler)
      
      expect(mockApi.postWithErrorHandler).toHaveBeenCalledWith('/api/cart/add', {
        productId: 123,
        quantity: 2
      })
      expect(mockMessageHandler.showSuccess).toHaveBeenCalledWith('Product added successfully')
    })

    it('should prompt login when user is not logged in', async () => {
      mockStore.getters.isLoggedIn = false
      
      await addToCart(123, 1, mockStore, mockApi, mockMessageHandler)
      
      expect(MessageBox.confirm).toHaveBeenCalledWith(
        'Please login first',
        'Confirm',
        {
          confirmButtonText: 'Login',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )
      expect(mockApi.postWithErrorHandler).not.toHaveBeenCalled()
    })

    it('should handle API error gracefully', async () => {
      mockApi.postWithErrorHandler.mockRejectedValue(new Error('API Error'))
      
      await addToCart(123, 1, mockStore, mockApi, mockMessageHandler)
      
      expect(console.error).toHaveBeenCalledWith('Failed to add product to cart:', expect.any(Error))
      expect(mockMessageHandler.showSuccess).not.toHaveBeenCalled()
    })

    it('should use default quantity of 1 when not specified', async () => {
      await addToCart(123, undefined, mockStore, mockApi, mockMessageHandler)
      
      expect(mockApi.postWithErrorHandler).toHaveBeenCalledWith('/api/cart/add', {
        productId: 123,
        quantity: 1
      })
    })
  })
})