// components/bottom-location/bottom-location.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    //距离底部的距离
    bottom: {
      type: Number,
      value: 0
    },
    //位置，左或右
    position: {
      type: String,
      value: 'right'
    },
    highlight: {
      type: Boolean,
      value: false
    },
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
    //定位
    onLocation() {
      this.triggerEvent('onLocation');
    }
  }
})