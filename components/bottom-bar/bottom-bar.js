// components/bottom-bar/bottom-bar.js
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
    position: {
      type: String,
      value: 'right'
    },
    points: {
      type: Number,
      value: 0
    },
    showPosition: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    dimensionText: "3D"
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //添加
    onAdd() {
      this.triggerEvent('onAdd');
    },
    //2D和3D切换
    onDimension() {
      this.setData({
        dimensionText: this.data.dimensionText === '2D' ? '3D' : '2D'
      })
      this.triggerEvent('onDimension');
    },
    //定位
    onLocation() {
      this.triggerEvent('onLocation');
    }
  }
})