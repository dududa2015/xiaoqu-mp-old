import {
  addMarkerFB
} from '../../apis/marker-feedback-apis'
import {
  updateMarkerFeedbackStatus
} from '../../apis/marker-apis'

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
            selectedReason: '-1'
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
      console.log(this.data.markerDetail)
      if(this.data.selectedReason === '-1') {
        wx.showToast({
          title: '请选择报错原因',
          icon: 'none'
        })
        return
      }
      const res =  await updateMarkerFeedbackStatus({
        xId: this.data.markerDetail.xId,
        feedbackType: this.data.selectedReason,
        feedbackDate: new Date(),
        feedbackUserId: wx.getStorageSync('userId')
      })
      if(res){
        wx.showToast({
          title: '反馈成功',
        })
        this.triggerEvent('onCloseFeedback', this.data.markerDetail)
      } else {
        wx.showToast({
          title: '反馈失败',
          icon: 'none'
        })
        this.triggerEvent('onCloseFeedback')
      }
      this.setData({
        showFeedback: false
      })      
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