import {
  generateXId,
  checkWords,
  checkChineseNumbers,
  msgSecCheck,
  checkString
} from '../../utils/util'
import {
  addMarker,
  updateMarker
} from '../../utils/apis'
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    markerTypeIndex: {
      type: Number,
      value: -1,
      observer(newVal, oldVal) {
        if (newVal > -1) {
          let title = ''
          let place = ''
          let bgColor = ''
          let required = false
          switch (newVal) {
            case 0:
              title = '楼号'
              place = '必填，最多10个字'
              bgColor = '#0074FE'
              required = true
              break;
            case 1:
              title = '出入口'
              place = '选填，最多10个字'
              bgColor = '#E85827'
              required = false
              break;
            case 2:
              title = '公厕'
              place = '选填，最多10个字'
              bgColor = '#C67171'
              required = false
              break;
            case 3:
              title = '设施'
              place = '必填，最多10个字'
              bgColor = '#C67171'
              required = true
              break;
            case 4:
              title = '其他'
              place = '必填，最多10个字'
              bgColor = '#C67171'
              required = true
              break;
            default:
              break;
          }
          this.setData({
            pointsCount: 0,
            title,
            place,
            bgColor,
            required,
            currentTagList: this.data[`tagList${newVal}`] || []
          })
        }
      }
    },
    showChooseMarker: {
      type: Boolean,
      value: false
    },
    showForm: {
      type: Boolean,
      value: false,
      observer(newVal, oldVal) {
        if (newVal && this.data.markerTypeIndex === 0) {
          const child = this.selectComponent('#suggestions');
          setTimeout(() => {
            if (child) {
              let name = wx.getStorageSync('name')
              if (name) {
                child.setNeighbor(name);
              }
            }
          }, 100);
        }
      }
    },
    markerDetail: {
      type: Object,
      value: {},
      observer(newVal, oldVal) {
        if (newVal) {

          this.onUserMarkerEdit(newVal)
        }
      }
    }
  },

  lifetimes: {
    attached() {
      this._markerPhotoPendingBatch = []
      this._markerPhotoUploadGen = 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    pointsCount: 0,
    action: '新增',
    title: '楼号',
    // showChooseMarker: false, //是否显示选点按钮
    showForm: false, //是否显示底部的编辑表单
    markerType: ['楼号', '出入口', '公厕', '设施', '其他'],
    // markerTypeIndex: 0,
    remarkTagList: [], //用于显示标记点详情用

    tagDirection: [{
      name: '➡️',
      label: '东',
      checked: false
    }, {
      name: '⬇️',
      label: '南',
      checked: false
    }, {
      name: '⬅️',
      label: '西',
      checked: false
    }, {
      name: '⬆️',
      label: '北',
      checked: false
    }, {
      name: '↗️',
      label: '东北',
      checked: false
    }, {
      name: '↘️',
      label: '东南',
      checked: false
    }, {
      name: '↙️',
      label: '西南',
      checked: false
    }, {
      name: '↖️',
      label: '西北',
      checked: false
    }],
    tagList0: [{ //楼栋标签
      name: '有门禁',
      checked: false
    }, {
      name: '大门常开',
      checked: false
    }, {
      name: '有电梯',
      checked: false
    }, {
      name: '无电梯',
      checked: false
    }, {
      name: '需业主开门',
      checked: false
    }, {
      name: '有保安登记',
      checked: false
    }, {
      name: '临时停车难',
      checked: false
    }, {
      name: '夜间关闭',
      checked: false
    }],
    tagList1: [{ //出入口标签
      name: '需要登记',
      checked: false
    }, {
      name: '禁止骑行',
      checked: false
    }, {
      name: '可以骑行',
      checked: false
    }, {
      name: '需要刷卡',
      checked: false
    }, {
      name: '24h开放',
      checked: false
    }],
    tagList2: [{ //出入口标签
      name: '卫生干净',
      checked: false
    }, {
      name: '有厕纸',
      checked: false
    }, {
      name: '24h开放',
      checked: false
    }],
    tagList3: [{ //设施
      name: '服务周到',
      checked: false
    }, {
      name: '价格公道',
      checked: false
    }, {
      name: '高效便捷',
      checked: false
    }, {
      name: '便捷高效',
      checked: false
    }, {
      name: '安全可靠',
      checked: false
    }, {
      name: '安全存放',
      checked: false
    }],
    tagList4: [{ //其他
      name: '经济实惠',
      checked: false
    }, {
      name: '安全卫生',
      checked: false
    }, {
      name: '使用方便',
      checked: false
    }],
    currentTagList: [], //当前标签，通过markerTypeIndex来取值
    tagNameList: [], //选中的标签
    place: '必填，最多10个字',
    /** 新增时现场照片（t-upload 受控列表） */
    markerUploadFiles: [],
    uploadMediaType: ['image'],
    uploadMax: 4,
    // 与后端 img_sec_check 1MB 上限一致（超出将被拒）
    uploadSizeLimitKb: 10240,
    uploadConfig: {
      count: 4,
      sizeType: ['compressed', 'original'],
      sourceType: ['camera', 'album']
    },
    uploadGridConfig: {
      column: 4,
      width: 108,
      height: 108
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onAddFile(e) {
      const batch = (e.detail && e.detail.files) || []
      if (!batch.length) return
      batch.forEach((f) => {
        if (f && !f._markerUploadId) {
          f._markerUploadId =
            'mu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
        }
      })
      this._markerPhotoPendingBatch = (this._markerPhotoPendingBatch || []).concat(batch)
    },
    _markerUploadMarkLoadingFailed(reasonToast) {
      const list = (this.data.markerUploadFiles || []).map((f) => {
        if (!f.cosObjectKey && f.status === 'loading') {
          return Object.assign({}, f, { status: 'failed', percent: 0 })
        }
        return f
      })
      this.setData({ markerUploadFiles: list })
      if (reasonToast) {
        wx.showToast({ title: reasonToast, icon: 'none' })
      }
    },
    _findMarkerUploadSlot(list, pf, localUrl) {
      const id = pf && pf._markerUploadId
      if (id) {
        const byId = list.findIndex(
          (f) => f._markerUploadId === id && !f.cosObjectKey
        )
        if (byId >= 0) return byId
      }
      return list.findIndex((f) => f.url === localUrl && !f.cosObjectKey)
    },
    _markerPatchSlotStatus(localUrl, pf, patch) {
      const list = (this.data.markerUploadFiles || []).slice()
      const k = this._findMarkerUploadSlot(list, pf, localUrl)
      if (k < 0) return false
      list[k] = Object.assign({}, list[k], patch)
      this.setData({ markerUploadFiles: list })
      return true
    },
    async _flushMarkerPhotoUploads(pending) {
      const gen = ++this._markerPhotoUploadGen
      const token = wx.getStorageSync('token')
      if (!token) {
        this._markerUploadMarkLoadingFailed('请先登录后再上传照片')
        return
      }
      if (!pending || !pending.length) return

      const list0 = this.data.markerUploadFiles || []
      const needUpload = pending.some((pf) => {
        const localUrl = pf && pf.url
        if (!localUrl) return false
        return list0.some((f) => {
          if (f.cosObjectKey) return false
          if (pf._markerUploadId && f._markerUploadId === pf._markerUploadId)
            return true
          return f.url === localUrl
        })
      })
      if (!needUpload) return

      const {
        uploadMarkerPhoto,
        compressThenPath
      } = require('../../apis/cos-upload-api')
      let idx = 0
      for (const pf of pending) {
        if (gen !== this._markerPhotoUploadGen) return
        if (idx > 0) {
          await new Promise((r) => setTimeout(r, 150))
        }
        idx += 1
        const localUrl = pf && pf.url
        if (!localUrl) continue
        const curList = this.data.markerUploadFiles || []
        const j = this._findMarkerUploadSlot(curList, pf, localUrl)
        if (j < 0) {
          wx.showToast({ title: '图片队列异常，请删除后重选', icon: 'none' })
          continue
        }
        try {
          const path = await compressThenPath(localUrl, 72)
          if (gen !== this._markerPhotoUploadGen) return
          const data = await uploadMarkerPhoto(path)
          if (gen !== this._markerPhotoUploadGen) return
          const list = (this.data.markerUploadFiles || []).slice()
          const k = this._findMarkerUploadSlot(list, pf, localUrl)
          if (k < 0) continue
          const item = Object.assign({}, list[k], {
            cosObjectKey: data.objectKey,
            publicUrl: data.publicUrl || '',
            percent: 100,
            status: 'done'
          })
          item.url =
            data.publicUrl && String(data.publicUrl).length > 0
              ? data.publicUrl
              : list[k].url
          list[k] = item
          this.setData({
            markerUploadFiles: list
          })
        } catch (err) {
          console.warn('marker photo upload', err)
          this._markerPatchSlotStatus(localUrl, pf, {
            status: 'failed',
            percent: 0
          })
          wx.showToast({
            title: (err && err.message) || '上传失败',
            icon: 'none'
          })
        }
      }
    },
    onMarkerUploadFail(e) {
      const err = e.detail || {}
      console.warn('marker upload fail', err)
      wx.showToast({
        title: err.errMsg || '上传失败',
        icon: 'none'
      })
    },
    onChooseMarker() {
      let pointsCount = this.data.pointsCount
      pointsCount += 1
      this.setData({
        pointsCount
      })
      this.triggerEvent('onChooseMarker', false)
    },
    onBackChooseMarker() {
      let pointsCount = this.data.pointsCount
      pointsCount -= 1
      this.setData({
        pointsCount
      })
      this.triggerEvent('onBackChooseMarker')
    },
    onFinishChooseMarker() {
      this.triggerEvent('onFinishChooseMarker')
    },
    onCancelChooseMarker() {
      this.triggerEvent('onCancelChooseMarker')
    },
    resetForm() {
      this.selectedMarker = null
      this.resetName()
      this.resetDirection()
      this.resetTagList()
      this._markerPhotoPendingBatch = []
      this._markerPhotoUploadGen = (this._markerPhotoUploadGen || 0) + 1
      this.setData({
        markerUploadFiles: []
      })
    },
    onMarkerUploadSuccess(e) {
      const files = e.detail && e.detail.files
      if (!files || !Array.isArray(files)) return
      const pending = this._markerPhotoPendingBatch || []
      this._markerPhotoPendingBatch = []
      const normalized = files.map((f) => {
        const o = Object.assign({}, f)
        if (o.cosObjectKey) {
          o.status = 'done'
        } else {
          o.status = 'loading'
          o.percent = 0
        }
        return o
      })
      this.setData({
        markerUploadFiles: normalized
      }, () => {
        if (pending.length) {
          wx.nextTick(() => {
            this._flushMarkerPhotoUploads(pending)
          })
        }
      })
    },
    onRemoveFile(e) {
      const idx = e.detail && e.detail.index
      if (idx === undefined || idx === null) return
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这张照片吗？',
        confirmText: '删除',
        confirmColor: '#e34d59',
        success: (res) => {
          if (!res.confirm) return
          const list = (this.data.markerUploadFiles || []).slice()
          if (idx < 0 || idx >= list.length) return
          list.splice(idx, 1)
          this.setData({
            markerUploadFiles: list
          })
        }
      })
    },
    resetName() {
      this.setData({
        name: ''
      })
    },
    resetDirection() {
      let tagDirection = []
      for (const item of this.data.tagDirection) {
        item.checked = false
        tagDirection.push(item)
      }

      this.setData({
        tagDirection
      })
    },
    resetTagList() {
      let tagList0 = this.data.tagList0.map(item => {
        return {
          name: item.name,
          checked: false
        }
      })
      let tagList1 = this.data.tagList1.map(item => {
        return {
          name: item.name,
          checked: false
        }
      })
      let tagList2 = this.data.tagList2.map(item => {
        return {
          name: item.name,
          checked: false
        }
      })
      this.setData({
        tagList0,
        tagList1,
        tagList2
      })
    },
    onSelectMarkerType(event) {
      const index = event.detail.value
      let place = ''
      switch (index) {
        case 0:
          place = '必填，最多10个字'
          break;
        case 1:
          place = '选填，最多10个字'
          break;
        case 2:
          place = '选填，最多10个字'
          break;
        case 3:
          place = '必填，最多10个字'
          break;
        case 4:
          place = '必填，最多10个字'
          break;
        default:
          place = '必填，最多10个字'
          break;
      }
      this.data.tagNameList = []

      this.setData({
        name: '',
        markerTypeIndex: index,
        place: place
      });
    },
    //方向标签选择
    onTagDirectionChange(e) {
      let item = e.currentTarget.dataset.item
      let tagDirection = []
      for (const t of this.data.tagDirection) {
        if (t.name === item.name) {
          t.checked = !item.checked
        } else {
          t.checked = false
        }
        tagDirection.push(t)
      }

      this.setData({
        tagDirection
      })
    },
    onTagChange(e) {
      let item = e.currentTarget.dataset.item;
      let tagList = this.data[`tagList${this.data.markerTypeIndex}`]
      tagList = tagList.map(t => {
        if (t.name === item.name) {
          t.checked = !item.checked;
        }
        return t;
      })
      this.setData({
        // [`tagList${this.data.markerTypeIndex}`]: tagList
        currentTagList: tagList
      });

    },
    onSaveMarker() {
      switch (this.data.markerTypeIndex) {
        case 0:
          if (!this.data.name) {
            wx.showToast({
              title: '请输入楼号名称',
              icon: 'none'
            })
            return
          }
          wx.setStorage({
            key: 'name',
            data: this.data.name.trim()
          })
          break;
        case 1:
          if (!this.data.name) {
            this.data.name = '出入口'
          }
          break;
        case 2:
          if (!this.data.name) {
            this.data.name = '公厕'
          }
          break;
        case 3:
          if (!this.data.name) {
            wx.showToast({
              title: '请输入名称',
              icon: 'none'
            })
            return
          }
          break;
        case 4:
          if (!this.data.name) {
            wx.showToast({
              title: '请输入名称',
              icon: 'none'
            })
            return
          }
          break;
        default:
          break;
      }
      //当前用户marker不为空为更新，否则为新增
      if (!checkWords(this.data.name)) {
        wx.showToast({
          title: '您输入的内容疑似违规，请重新输入',
          icon: 'none'
        })
        return
      }
      // if (hasConsecutive4Digits(this.data.name)) {
      //   this.showWarnMessage('您输入的内容疑似密码，请重新输入')
      //   return
      // }
      let userInfo = wx.getStorageSync('userInfo')
      //2024-11-9去掉&& !userInfo.isAdmin
      if (checkChineseNumbers(this.data.name)) {
        wx.showToast({
          title: '您输入的内容疑似密码，请重新输入',
          icon: 'none'
        })
        return
      }

      msgSecCheck(this.data.name).then(res => {
        if (res) {
          wx.showLoading({
            title: '正在保存',
            mask: true
          })
          const that = this
          getApp().globalData.mapCtx.getCenterLocation({
            success: function (res) {
              const {
                longitude,
                latitude
              } = res
              if (that.selectedMarker) {
                that.updateMarker(longitude, latitude)
              } else {
                that.addMarker(longitude, latitude)
              }
            },
            fail: function (res) {
              console.log(res)
            }
          })
        }
      })
    },
    //获取方位箭头
    getDirection() {
      let o = this.data.tagDirection.find(item => item.checked)
      return o ? o.name : ''
    },
    //不能输入密码等
    addMarker(longitude, latitude) {
      let uid = generateXId(latitude, longitude)
      //如果为true，则delete = 0 表示直接通过，为-1表示需要审核
      let deleted = checkString(this.data.name) ? 0 : -1
      let direction = this.getDirection()
      this.data.name = this.data.name + direction
      let enableMap = wx.getStorageSync('enableMap')
      let mapType = wx.getStorageSync('mapType')
      let isPersonal = mapType === 2 //1为公共地图，2为个人地图
      let param = {
        xId: uid,
        userId: wx.getStorageSync('userId'),
        type: this.data.markerTypeIndex,
        name: this.data.name,
        remark: this.getRemark(),
        imageObjectKeys: this.getImageObjectKeys(),
        deleted,
        lat: latitude,
        lng: longitude,
        isPersonal
      }
      const that = this
      addMarker(param).then(res => {
        if (res > 0) {
          wx.showToast({
            title: '添加成功',
          })
          that.triggerEvent('onFormClose')
          that.triggerEvent('addUserMarkerByUser', {
            latitude,
            longitude,
            uid,
            name: that.data.name,
            markerTypeIndex: that.data.markerTypeIndex,
            deleted
          })

          let name = that.data.name
          that.resetForm()
          // wx.showTabBar()
          that.setData({
            action: '新增',
            showCenterMarker: false,
            showForm: false,
            markerTypeIndex: 0,
            name: '',
            tagNameList: []
          });
        } else if (res === -3) {
          wx.showToast({
            title: '移动一下位置再保存',
            icon: 'none',
            duration: 3000
          })
        } else {
          wx.showToast({
            title: '添加失败，请稍后重试',
            icon: 'none'
          })
        }
      })
    },
    updateMarker(longitude, latitude) {
      //如果为true，则delete = 0 表示直接通过，为-1表示需要审核
      let deleted = checkString(this.data.name) ? 0 : -1
      let direction = this.getDirection()
      this.data.name = this.data.name + direction
      let mapType = wx.getStorageSync('mapType')
      let isPersonal = mapType === 2 //1为公共地图，2为个人地图
      let param = {
        xId: this.selectedMarker.xId,
        userId: this.selectedMarker.userId,
        type: this.data.markerTypeIndex,
        name: this.data.name,
        remark: this.getRemark(),
        imageObjectKeys: this.getImageObjectKeys(),
        deleted,
        lng: longitude,
        lat: latitude,
        updateUserId: wx.getStorageSync('userId'),
        isPersonal
      }
      const that = this
      updateMarker(param).then(res => {
        wx.showToast({
          title: '修改成功',
        })
        that.triggerEvent('onFormClose')
        that.triggerEvent('updateUserMarkerByUser', {
          xId: that.selectedMarker.xId,
          name: that.data.name,
          longitude,
          latitude,
          deleted
        })

        //改变子组件的属性，从而重新生成你想输入的词
        let name = that.data.name
        that.resetForm()
        wx.showTabBar()
        that.setData({
          showCenterMarker: false,
          showForm: false,
          xId: 0,
          showPOI: false,
          markerTypeIndex: 0,
          name: '',
          tagNameList: []
        });
      })
    },
    onFormClose() {
      this.resetForm()
      // wx.showTabBar()
      this.setData({
        showCenterMarker: false,
        showForm: false
      })
      //编辑的时候，关闭form,需要显示添加和定位按钮
      this.triggerEvent('onFormClose', this.data.action === '编辑')
      // this.triggerEvent('showCenterMarker', false)
    },
    getRemark() {
      let arr = this.data.currentTagList.filter(item => {
        if (item.checked) {
          return item.name
        }
      })
      return arr.map(item => item.name).join(',')
    },
    getImageObjectKeys() {
      return (this.data.markerUploadFiles || [])
        .map((f) => f.cosObjectKey)
        .filter(Boolean)
    },
    /** 编辑时把后端 images 转为 t-upload 条目（已上传，仅展示与提交 objectKey） */
    buildMarkerUploadFilesFromServer(images) {
      if (!images || !images.length) return []
      const list = images
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      return list
        .map((it) => {
          const cosObjectKey = it.objectKey || it.cosObjectKey || ''
          const url = it.presignedGetUrl || it.url || it.publicUrl || ''
          if (!cosObjectKey && !url) return null
          return {
            url,
            cosObjectKey,
            status: 'done',
            percent: 100,
            type: 'image',
          }
        })
        .filter(Boolean)
    },
    //编辑用户标记点
    onUserMarkerEdit(marker) {
      this.selectedMarker = marker
      this._markerPhotoPendingBatch = []
      this._markerPhotoUploadGen = (this._markerPhotoUploadGen || 0) + 1
      const markerUploadFiles = this.buildMarkerUploadFilesFromServer(
        marker && marker.images
      )
      let has = this.hasDirection(this.selectedMarker.name)
      let name = this.initName(this.selectedMarker.name, has)
      this.initDirection(this.selectedMarker.name, has)

      let currentTagList = this.data[`tagList${this.selectedMarker.type}`]
      for (const item of currentTagList) {
        for (const s of this.selectedMarker.remark.split(',')) {
          if (item.name === s) {
            item.checked = true
          }
        }
      }
      this.setData({
        action: '编辑',
        showCenterMarker: true,
        markerTypeIndex: -1, //和settimout一起生效，不然有bug，标签无法选中
        name: name,
        remark: this.selectedMarker.remark,
        currentTagList: this.data[`tagList${this.selectedMarker.type}`],
        markerUploadFiles,
      })

      setTimeout(() => {
        this.setData({
          markerTypeIndex: this.selectedMarker.type
        })
      }, 10);
    },
    //最后一个字符是否以箭头结束
    hasDirection(name) {
      const direction = '➡️⬇️⬅️⬆️↗️↘️↙️↖️'
      if (name.length > 0) {
        let c = name[name.length - 1]
        return direction.includes(c)
      } else {
        return false
      }
    },
    //在编辑marker时调用,分解name
    initName(name, hasDirection) {
      if (hasDirection) {
        return name.substring(0, name.length - 2)
      } else {
        return name
      }
    },
    //在编辑marker时调用,分解name
    initDirection(name, hasDirection) {
      if (hasDirection) {
        let direction = name.slice(name.length - 2) //name.substring(100, 2)
        let tagDirection = []
        console.log('direction', direction, this.data.tagDirection)
        for (const item of this.data.tagDirection) {
          if (item.name === direction) {
            item.checked = true
          }
          tagDirection.push(item)
        }
        this.setData({
          tagDirection
        })
      }
    },
    //获取猜你想输入
    getSuggestions(event) {
      let name = event.detail.name
      this.setData({
        name
      })
    },
  }
})