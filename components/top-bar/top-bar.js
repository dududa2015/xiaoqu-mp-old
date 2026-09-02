const { checkLoginAndNavigate } = require('../../utils/util.js')
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    rect: {
      type: Object,
      value: {}
    },
    //位置，1和2代表左和右，默认是2在右
    position: {
      type: String,
      value: 'right'
    },
    showRedDot: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChooseLocation() {
      wx.chooseLocation({
        success: (res) => {
          this.triggerEvent('onChooseLocation', res)
        }
      });
    },
    onCS() {
      wx.navigateTo({
        url: '/pages/my/customerService/customerService',
      })
    },
    onSetting() {
      if (checkLoginAndNavigate()) {
        this.triggerEvent('onSetting')
      }
    }
  }
})
