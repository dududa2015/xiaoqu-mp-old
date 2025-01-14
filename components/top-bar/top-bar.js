// components/top-bar/top-bar.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    //位置，1和2代表左和右，默认是2在右
    position: {
      type: String,
      value: 'right'
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
    onColor() {
      this.triggerEvent('onColor');
    },
    onSetting() {
      this.triggerEvent('onSetting');
    }
  }
})