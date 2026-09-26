/** 本地分段器。设置页和我的标记若改用组件库的 t-segmented，这份可以不参与上传。 */

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
    /** 首次算出滑块位置。 */
    ready() {
      this.updateThumb()
    }
  },

  observers: {
    /** 选项变化时重建并移动滑块。 */
    options(options) {
      this.updateOptions(options)
    },
    'value, segmentItems'() {
      this.updateActiveIndex()
    }
  },

  methods: {
    /** 给每项补上选中态。 */
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

    /** 按 value 找到当前下标。 */
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

    /** 量每一段宽度，移动白色滑块。 */
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

    /** 点选后通知外面。 */
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
