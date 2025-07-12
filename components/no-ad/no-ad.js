import {
  setStorageWithExpire,
  getStorageWithExpire
} from '../../utils/util'
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    showNoAd: {
      type: Boolean,
      value: false,
      observer(newVal, oldVal) {
        if (newVal) {
          this.init()
          // // 调用开始动画函数
          // this.startAnimation();
        }
      }
    },
    videoCount:{
      type: Number,
      value: 0,
      observer(newVal, oldVal){
        if(newVal){
          this.setData({
            number: newVal
          })
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    number: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    init(){
      let number = getStorageWithExpire('videoCount')
      this.setData({
        number
      })
    },
    //关闭
    onClose() {
      this.triggerEvent('onNoAdClose')
    },
    //观看广告
    onViewAd(){
      // let number = getStorageWithExpire('videoCount')
      // number = number + 1
      // this.setData({
      //   number
      // })
      this.triggerEvent('onViewAd')
    }
  }
})