import {
  updateMap
} from '../../apis/map-api'
const {
  getSession,
  canChangeIsPub
} = require('../../utils/map-session')

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
    showCommunityDetail: true,
    showRedDot: false,
    showLocIconHelp: false,
    mapType: 1,
    mapName: '公共地图',
    mapRole: '',
    includePublicMap: false,
    canChangeIsPub: false,
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
      const position = wx.getStorageSync('position')
      const markerShape = wx.getStorageSync('markerShape')
      const enableRotate = wx.getStorageSync('enableRotate')
      const enableSatellite = wx.getStorageSync('enableSatellite')
      const enable3D = wx.getStorageSync('enable3D')
      const showCommunityDetail = wx.getStorageSync('showCommunityDetail')
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
          showCommunityDetail: true
        })
        wx.setStorageSync('showCommunityDetail', true)
      }
      const session = getSession()
      this.setData({
        mapType: session.mapType,
        mapName: session.mapName,
        mapRole: session.mapRole,
        includePublicMap: !!session.isPub,
        canChangeIsPub: canChangeIsPub(session)
      })
    },
    ensureLoggedInForMapMode() {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        return true
      }
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return false
    },
    onOpenMapSwitcher() {
      if (!this.ensureLoggedInForMapMode()) {
        return
      }
      this.triggerEvent('onOpenMapSwitcher')
    },
    onMergePubMapSwitch(e) {
      const next = e.detail.value
      const prev = !next
      const session = getSession()
      if (!this.ensureLoggedInForMapMode() || !canChangeIsPub(session) || !session.mapId) {
        this.setData({
          includePublicMap: prev
        })
        return
      }
      this.applyIncludePublicMap(next).then((ok) => {
        if (!ok) {
          this.setData({
            includePublicMap: prev
          })
        }
      })
    },
    applyIncludePublicMap(isPub) {
      const session = getSession()
      return updateMap({
        mapId: session.mapId,
        isPub
      }).then(res => {
        if (res !== false && res !== null) {
          wx.setStorageSync('mapIsPub', isPub)
          this.setData({
            includePublicMap: isPub
          })
          this.triggerEvent('onMapTypeChange', getSession())
          return true
        }
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        })
        return false
      }).catch(() => false)
    },
    onClose() {
      this.triggerEvent('onSettingClose')
    },
    onChoose(event) {
      const index = parseInt(event.currentTarget.dataset.index)
      this.setData({
        enableSatellite: index === 1
      })
      wx.setStorageSync('enableSatellite', index === 1)
      this.triggerEvent('onSatellite', index === 1)
    },
    onPersonalmapChange(e) {
      this.setData({
        enableMap: e.detail.value
      });
      wx.setStorageSync('enableMap', e.detail.value)
      this.triggerEvent('mapChange', e.detail.value)
    },
    onMapHelp() {
      this.setData({
        showConfirm: true
      })
    },
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
    onPositionChange(e) {
      this.setData({
        position: e.detail.value
      });
      wx.setStorageSync('position', e.detail.value)
      this.triggerEvent('onPosition', e.detail.value)
    },
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
    onCommunityDetailChange(e) {
      const value = e.detail.value
      this.setData({
        showCommunityDetail: value
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
    onRotateChange(e) {
      this.setData({
        enableRotate: e.detail.value
      })
      wx.setStorageSync('enableRotate', e.detail.value)
      this.triggerEvent('onRotate', e.detail.value)
    },
    on3DChange(e) {
      this.setData({
        enable3D: e.detail.value
      })
      wx.setStorageSync('enable3D', e.detail.value)
      this.triggerEvent('on3D', e.detail.value)
    },
    onScreenOnChange(e) {
      wx.setKeepScreenOn({
        keepScreenOn: e.detail.value
      })
      wx.setStorageSync('enableScreenOn', e.detail.value)
    },
    onShowLocIconHelp() {
      this.setData({
        showLocIconHelp: !this.data.showLocIconHelp
      })
    },
    startAnimation() {
      const interval = setInterval(() => {
        if (this.data.count < 3) {
          this.setData({
            isShowBorder: !this.data.isShowBorder
          });
          this.setData({
            count: this.data.count + 0.5
          });
        } else {
          clearInterval(interval);
        }
      }, 500);
    }
  }
})
