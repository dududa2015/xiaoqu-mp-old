function getRect(ctx, selector) {
  return new Promise((resolve) => {
    ctx.createSelectorQuery().select(selector).boundingClientRect().exec((res) => {
      resolve(res && res[0])
    })
  })
}

Component({
  properties: {
    options: {
      type: Array,
      value: []
    },
    value: {
      type: String,
      value: ''
    },
    block: {
      type: Boolean,
      value: false
    },
    disabled: {
      type: Boolean,
      value: false
    }
  },

  data: {
    segmentItems: [],
    activeIndex: -1,
    thumbStyle: ''
  },

  lifetimes: {
    ready() {
      this.updateThumb()
    }
  },

  observers: {
    options(options) {
      this.updateOptions(options)
    },
    'value, segmentItems'() {
      this.updateActiveIndex()
    }
  },

  methods: {
    updateOptions(options) {
      const list = options || []
      const segmentItems = list.map((option) => {
        if (typeof option === 'string' || typeof option === 'number') {
          return { value: String(option), label: String(option) }
        }
        return {
          value: option.value,
          label: option.label != null ? option.label : String(option.value)
        }
      })
      this.setData({ segmentItems })
    },

    updateActiveIndex() {
      const segmentItems = this.data.segmentItems || []
      const value = this.data.value
      let activeIndex = -1
      if (value != null && value !== '') {
        activeIndex = segmentItems.findIndex((item) => item.value === value)
      }
      if (activeIndex === this.data.activeIndex) {
        this.updateThumb()
        return
      }
      this.setData({ activeIndex }, () => {
        this.updateThumb()
      })
    },

    updateThumb() {
      const activeIndex = this.data.activeIndex
      if (activeIndex < 0) {
        return
      }
      Promise.all([
        getRect(this, '.t-segmented-item-' + activeIndex),
        getRect(this, '.t-segmented__group')
      ]).then(([itemRect, groupRect]) => {
        if (!itemRect || !groupRect || !itemRect.width) {
          return
        }
        const left = itemRect.left - groupRect.left
        this.setData({
          thumbStyle: 'width: ' + itemRect.width + 'px; transform: translateX(' + left + 'px);'
        })
      })
    },

    handleSelect(e) {
      if (this.data.disabled) {
        return
      }
      const value = e.currentTarget.dataset.value
      const segmentItems = this.data.segmentItems || []
      const index = segmentItems.findIndex((item) => item.value === value)
      if (index < 0 || index === this.data.activeIndex) {
        return
      }
      this.triggerEvent('change', {
        value: segmentItems[index].value
      })
    }
  }
})
