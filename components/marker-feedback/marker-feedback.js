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
      if (this.data.selectedReason === '-1') {
        wx.showToast({
          title: '请选择报错原因',
          icon: 'none'
        })
        return
      }

      const today = new Date().toDateString()
      const feedbackCountKey = 'feedbackCount'
      const feedbackDateKey = 'feedbackDate'

      const savedDate = wx.getStorageSync(feedbackDateKey)
      let count = wx.getStorageSync(feedbackCountKey) || 0

      if (savedDate !== today) {
        count = 0
        wx.setStorageSync(feedbackDateKey, today)
        wx.setStorageSync(feedbackCountKey, 0)
      }

      if (count >= 10) {
        wx.showToast({
          title: '今日报错次数已达上限',
          icon: 'none'
        })
        return
      }

      const res = await updateMarkerFeedbackStatus({
        xId: this.data.markerDetail.xId,
        feedbackType: this.data.selectedReason,
        feedbackDate: new Date(),
        feedbackUserId: wx.getStorageSync('userId')
      })
      if (res) {
        wx.setStorageSync(feedbackCountKey, count + 1)
        wx.showToast({
          title: '报错成功',
        })
        this.triggerEvent('onCloseFeedback', this.data.markerDetail)
      } else {
        wx.showToast({
          title: '报错失败',
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