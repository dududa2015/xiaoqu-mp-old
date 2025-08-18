// components/marker-feedback/marker-feedback.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    showFeedback:{
      type: Boolean,
      value: false,
      observer(newVal,oldVal){
        if(newVal){
          this.setData({
            selectedReason: 0
          })
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    selectedReason: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onSave() {
      console.log(this.data.selectedReason)
      this.setData({
        showFeedback: false
      })
      this.triggerEvent('onCloseFeedback')
    },
    onClose(){
      this.setData({
        showFeedback: false
      })
      this.triggerEvent('onCloseFeedback')
    },
    onChange(e){
      this.setData({ selectedReason: e.detail.value });
    },
    onVisibleChange() {
      this.setData({
        showFeedback: true
      })
    }
  }
})