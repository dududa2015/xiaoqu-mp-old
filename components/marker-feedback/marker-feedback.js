import {
  addMarkerFB
} from '../../apis/marker-feedback-apis'
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    showFeedback: {
      type: Boolean,
      value: false,
    },
    markerDetail: {
      type: Object,
      value: {},
      observer(newVal, oldVal) {
        if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
          this.setData({
            selectedReason: '0'
          })
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    selectedReason: '0'
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async onSave() {
      console.log(this.data.selectedReason)
      const res =  await addMarkerFB({
        xId: this.data.markerDetail.xId,
        reason: this.data.selectedReason
      })
      if(res){
        wx.showToast({
          title: '反馈成功',
        })
      } else {
        wx.showToast({
          title: '反馈失败',
          icon: 'none'
        })
      }
      this.setData({
        showFeedback: false
      })
      this.triggerEvent('onCloseFeedback')
    },
    onClose() {
      this.setData({
        showFeedback: false
      })
      this.triggerEvent('onCloseFeedback')
    },
    onChange(e) {
      this.setData({
        selectedReason: e.detail.value
      });
    },
    onVisibleChange() {
      this.setData({
        showFeedback: true
      })
    }
  }
})