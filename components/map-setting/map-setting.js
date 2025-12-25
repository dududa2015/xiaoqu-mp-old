// components/map-layer/map-layer.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    showSetting: {
      type: Boolean,
      value: false,
      observer(newVal, oldVal) {
        if (newVal) {
          this.initStorage()
          // // 调用开始动画函数
          // this.startAnimation();
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    checkedIndex: 0,
    isShowBorder: false,
    count: 0,
    showCommunityDetail: false,
    showRedDot: true,
    locIconList: [{
      url: '/images/loc-marker/0.png',
    }, {
      url: '/images/loc-marker/1.png',
    }, {
      url: '/images/loc-marker/2.png',
    }, {
      url: '/images/loc-marker/3.png',
    }, {
      url: '/images/loc-marker/4.png',
    }]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    initStorage() {
      //控件位置
      const position = wx.getStorageSync('position')
      //标记形状
      const markerShape = wx.getStorageSync('markerShape')
      //开启旋转
      const enableRotate = wx.getStorageSync('enableRotate')
      //开启卫星地图
      const enableSatellite = wx.getStorageSync('enableSatellite')
      //开启3d楼块
      const enable3D = wx.getStorageSync('enable3D')
      //显示小区边界和出入口
      const showCommunityDetail = wx.getStorageSync('showCommunityDetail')
      //红点（统一控制设置入口和小区边界红点）
      const showRedDot = wx.getStorageSync('showRedDot')
      this.setData({
        position: position ? position : 'right',
        markerShape: markerShape ? markerShape : 'label'
      })

      if (typeof enableRotate === 'boolean') {
        this.setData({
          enableRotate
        })
      }
      if (typeof enableSatellite === 'boolean') {
        this.setData({
          enableSatellite
        })
      }
      if (typeof enable3D === 'boolean') {
        this.setData({
          enable3D
        })
      }
      if (typeof showCommunityDetail === 'boolean') {
        this.setData({
          showCommunityDetail
        })
      } else {
        this.setData({
          showCommunityDetail: false
        })
      }
      this.setData({
        showRedDot: typeof showRedDot === 'boolean' ? showRedDot : true
      })
    },
    onClose() {
      this.triggerEvent('onSettingClose')
    },
    //标准地图和卫星地图的选择
    onChoose(event) {
      const index = parseInt(event.currentTarget.dataset.index)
      this.setData({
        enableSatellite: index === 1
      })
      wx.setStorageSync('enableSatellite', index === 1)
      this.triggerEvent('onSatellite', index === 1)
    },
    //开启个人地图
    onPersonalmapChange(e) {
      this.setData({
        enableMap: e.detail.value
      });
      wx.setStorageSync('enableMap', e.detail.value)
      this.triggerEvent('mapChange', e.detail.value)
    },
    //个人地图帮助
    onMapHelp() {
      this.setData({
        showConfirm: true
      })
    },
    //导入个人数据
    //要先开启个人地图才能导入个人数据
    onImportPersonalDataChange(e) {
      const enableMap = wx.getStorageSync('enableMap')
      if (enableMap) {
        this.setData({
          enableImportPersonalData: e.detail.value
        });
        wx.setStorageSync('enableImportPersonalData', e.detail.value)
      } else {
        wx.showToast({
          title: '请先开启个人地图',
          icon: 'none'
        })
        setTimeout(() => {
          this.setData({
            enableImportPersonalData: false
          })
        }, 500);
      }
    },
    //定位图标选择
    onLocIcon(e) {
      const index = parseInt(e.currentTarget.dataset.index)
      let locIconIndex = wx.getStorageSync('locIconIndex')

      if (index === locIconIndex) {
        locIconIndex = -1
        wx.showToast({
          title: '使用默认图标需要重启应用',
          icon: 'none',
          duration: 3000
        })
      } else {
        locIconIndex = index
      }

      this.setData({
        locIconIndex
      })
      wx.setStorageSync('locIconIndex', locIconIndex)
      this.triggerEvent('onLocIcon', locIconIndex)
    },
    //地图控件位置选择
    onPositionChange(e) {
      this.setData({
        position: e.detail.value
      });
      wx.setStorageSync('position', e.detail.value)
      this.triggerEvent('onPosition', e.detail.value)
    },
    //标记形状选择
    onMarkerShapeChange(e) {
      if (e.detail.value === 'callout') {
        wx.showModal({
          title: '',
          content: '会使地图变卡，确认要切换吗？',
          complete: (res) => {
            if (res.cancel) {
              this.setData({
                markerShape: 'label'
              });
              wx.setStorageSync('markerShape', 'label')
            }
            if (res.confirm) {
              wx.setStorageSync('markerShape', e.detail.value)
              this.setData({
                markerShape: e.detail.value
              });
            }
          }
        })
      } else {
        wx.setStorageSync('markerShape', e.detail.value)
        this.setData({
          markerShape: 'label'
        });
      }
    },
    //显示小区边界和出入口
    onCommunityDetailChange(e) {
      const value = e.detail.value
      this.setData({
        showCommunityDetail: value,
        showRedDot: false
      })
      this.triggerEvent('onCommunityDetailChange', value)
    },
    showDialog(e) {
      const {
        key
      } = e.currentTarget.dataset;
      this.setData({
        [key]: true,
        dialogKey: key
      });
    },

    closeDialog() {
      const {
        dialogKey
      } = this.data;
      this.setData({
        [dialogKey]: false
      });
    },
    //开启旋转
    onRotateChange(e) {
      this.setData({
        enableRotate: e.detail.value
      })
      wx.setStorageSync('enableRotate', e.detail.value)
      this.triggerEvent('onRotate', e.detail.value)
    },
    //开启3d楼块
    on3DChange(e) {
      this.setData({
        enable3D: e.detail.value
      })
      wx.setStorageSync('enable3D', e.detail.value)
      this.triggerEvent('on3D', e.detail.value)
    },
    //开启屏幕常亮
    onScreenOnChange(e) {
      wx.setKeepScreenOn({
        keepScreenOn: e.detail.value
      })
      wx.setStorageSync('enableScreenOn', e.detail.value)
    },
    startAnimation() {
      // 定时器，控制边框显示隐藏
      const interval = setInterval(() => {
        if (this.data.count < 3) {
          // 切换边框显示状态
          this.setData({
            isShowBorder: !this.data.isShowBorder
          });
          // 计数器加 1
          this.setData({
            count: this.data.count + 0.5
          });
        } else {
          // 达到三次后清除定时器
          clearInterval(interval);
        }
      }, 500);
    }
  }
})