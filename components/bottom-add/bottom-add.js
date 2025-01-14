// components/bottom-add/bottom-add.js
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
    //添加
    onAdd() {
      this.triggerEvent('onAdd');
    },
  }
})