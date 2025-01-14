import {
  getColorFromStorage
} from '../../utils/util'
Component({
  options: {
  },
  /**
   * 组件的属性列表
   */
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer(newVal, oldVal) {
        this.hasChecked = false

        const color = getColorFromStorage()
        const index = this.data.colorList.findIndex(item => item === color)
        this.setData({
          checkedIndex: index
        })
        console.log(this.data.colorList)
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    checkedIndex: 0,
    //#0074FE'为默认的颜色
    // colorList: ['#0074FE', '#800000', '#800080', '#000080', '#006400', '#008080', '#cd5c5c', '#ff7f50', '#ffd700', '#c0c0c0']
    colorList: ['#0074FE', '#008C8C', '#002FA7', '#E85827', '#8c444f', '#8F4B28', '#003153', '#81D8D0', '#B05923', '#F9DC24', '#4C0009', '#800080', '#006400', '#cd5c5c']
  },
  watch: {
    visible(newVal, oldVal) {
      console.log(`count changed from ${oldVal} to ${newVal}`);
      // 可以在这里执行其他操作，例如调用接口等  
    }
  },
  /**
   * 三个方法中的status，-2表示未选或者选择了默认颜色，-1表示在弹窗中选择颜色后marker临时生效，0表示关闭颜色窗口后的3秒生效，1表示保存的生效
   */
  methods: {
    //选择颜色
    onCheck(event) {
      this.hasChecked = true
      const { index } = event.currentTarget.dataset
      console.log(index)
      this.setData({
        checkedIndex: index
      })
      this.triggerEvent('getColor', { color: this.data.colorList[index], status: -1 });
    },
    //关闭弹窗
    onFormClose() {
      if (this.hasChecked) {
        wx.showModal({
          title: '温馨提示',
          content: '确认不保存吗？',
          complete: (res) => {
            if (res.confirm) {
              this.setData({
                visible: false
              })
              this.triggerEvent('getColor', { color: this.data.colorList[0], status: 0 });
            }
          }
        })
      } else {
        this.setData({
          visible: false
        })
        this.triggerEvent('getColor', { color: this.data.colorList[0], status: -2 });
      }
    },
    //保存按钮
    onSave() {
      this.triggerEvent('getColor', { color: this.data.colorList[this.data.checkedIndex], status: 1 });
    },
    onVisibleChange(e) {
      console.log(e.detail.visible)
    },
  }
})