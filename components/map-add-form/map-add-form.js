const TAGS = {
  0: ['有门禁', '大门常开', '有电梯', '无电梯', '需业主开门', '有保安登记', '临时停车难', '夜间关闭'],
  1: ['需要登记', '禁止骑行', '可以骑行', '需要刷卡', '24h开放'],
  2: ['卫生干净', '有厕纸', '24h开放'],
  3: ['服务周到', '价格公道', '高效便捷', '便捷高效', '安全可靠', '安全存放'],
  4: ['经济实惠', '安全卫生', '使用方便']
}

const QUICK = {
  1: ['东门', '南门', '西门', '北门', '正门', '侧门'],
  3: ['维修点', '换电站', '外卖柜'],
  4: ['便利店', '自助售货机', '洗车点']
}

const {
  generateSuggestions,
  generateNeighborBuildings,
  toChips
} = require('../../utils/building-suggestions')

const DIRECTIONS = [
  { icon: '➡️', label: '东' },
  { icon: '⬇️', label: '南' },
  { icon: '⬅️', label: '西' },
  { icon: '⬆️', label: '北' },
  { icon: '↗️', label: '东北' },
  { icon: '↘️', label: '东南' },
  { icon: '↙️', label: '西南' },
  { icon: '↖️', label: '西北' }
]

const sheetDrag = require('../../behaviors/sheet-drag')

Component({
  behaviors: [sheetDrag],

  properties: {
    show: {
      type: Boolean,
      value: false
    },
    typeIndex: {
      type: Number,
      value: 0
    },
    typeName: {
      type: String,
      value: ''
    },
    color: {
      type: String,
      value: '#0074FE'
    },
    label: {
      type: String,
      value: '名称'
    },
    needName: {
      type: Boolean,
      value: false
    },
    editMarker: {
      type: Object,
      value: null
    }
  },

  data: {
    directions: DIRECTIONS,
    name: '',
    direction: '',
    formSize: 0.42,
    showQuick: false,
    suggestions: [],
    tags: [],
    photos: [],
    photoKeys: [],
    editing: false
  },

  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this._windowWidth = info.windowWidth || 375
      this._windowHeight = info.windowHeight || 667
    }
  },

  observers: {
    show(visible) {
      if (visible) {
        const filled = this.fillFromMarker(this.properties.editMarker)
        this.setData({
          editing: !!(this.properties.editMarker && this.properties.editMarker.xId),
          name: filled.name,
          direction: filled.direction,
          formSize: this.measureForm(),
          showQuick: this.hasQuick(this.data.typeIndex),
          suggestions: this.buildSuggestions(this.data.typeIndex, filled.name, !filled.name),
          tags: filled.tags,
          photos: filled.photos,
          photoKeys: filled.photoKeys
        }, () => {
          this.readCard((cardHeight) => {
            if (!this.data.show) {
              return
            }
            if (!cardHeight) {
              this.beginOpen(this.data.formSize)
              this.refit()
              return
            }
            this.applyFormSize(this.sizeFromHeight(cardHeight), true)
          })
        })
        return
      }
      this._sheetSeenOpen = false
      this._opening = false
      this.scrollSheet(0)
    }
  },

  methods: {
    fillFromMarker(marker) {
      const typeIndex = this.data.typeIndex
      if (!marker || !marker.xId) {
        return {
          name: '',
          direction: '',
          tags: this.buildTags(typeIndex),
          photos: [],
          photoKeys: []
        }
      }
      let name = String(marker.name || '')
      let direction = ''
      DIRECTIONS.forEach((item) => {
        if (name.endsWith(item.icon)) {
          direction = item.label
          name = name.slice(0, -item.icon.length)
        }
      })
      const selected = String(marker.remark || '').split(',').filter(Boolean)
      const tags = this.buildTags(typeIndex).map((item) => ({
        name: item.name,
        checked: selected.indexOf(item.name) !== -1
      }))
      const images = (marker.images || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      const photos = []
      const photoKeys = []
      images.forEach((item) => {
        const src = item.presignedGetUrl || item.url || item.publicUrl || ''
        const key = item.objectKey || item.cosObjectKey || ''
        if (src || key) {
          photos.push(src || key)
          photoKeys.push(key)
        }
      })
      return { name, direction, tags, photos, photoKeys }
    },

    hasQuick(typeIndex) {
      return typeIndex === 0 || typeIndex === 1 || typeIndex === 3 || typeIndex === 4
    },

    buildTags(typeIndex) {
      return (TAGS[typeIndex] || []).map((name) => ({ name, checked: false }))
    },

    buildSuggestions(typeIndex, name, initial) {
      if (typeIndex === 0) {
        const text = (name || '').trim()
        if (initial || !text) {
          const stored = text || wx.getStorageSync('buildingName') || ''
          return toChips(generateNeighborBuildings(stored))
        }
        return toChips(generateSuggestions(text).map((item) => item.toUpperCase()))
      }
      const list = QUICK[typeIndex] || []
      const text = (name || '').trim()
      return list
        .filter((item) => !text || item.indexOf(text) !== -1)
        .map((item) => ({ name: item, checked: item === text }))
    },

    measureForm() {
      const width = this._windowWidth || 375
      const height = this._windowHeight || 667
      const rpx = width / 750
      const typeIndex = this.data.typeIndex
      let content = 96 + 97 + 164 + 16
      if (this.hasQuick(typeIndex)) {
        content += 105
      }
      if (typeIndex === 0) {
        content += 105
      }
      if (TAGS[typeIndex]) {
        content += 105
      }
      return Math.min(0.92, content * rpx / height)
    },

    sizeFromHeight(cardHeight) {
      const height = this._windowHeight || 667
      return Math.min(0.92, (cardHeight + 1) / height)
    },

    readCard(done, retry) {
      const left = retry == null ? 6 : retry
      this.createSelectorQuery()
        .select('.sheet-card')
        .boundingClientRect()
        .exec((res) => {
          const rect = res && res[0]
          if (!rect || rect.height < 40) {
            if (left > 0) {
              wx.nextTick(() => this.readCard(done, left - 1))
              return
            }
            done(0)
            return
          }
          done(rect.height)
        })
    },

    applyFormSize(formSize, open) {
      const next = formSize || this.measureForm()
      const finish = () => {
        if (!this.data.show) {
          return
        }
        if (open) {
          this.beginOpen(this.data.formSize)
          return
        }
        this.scrollSheet(this.data.formSize)
      }
      if (Math.abs(next - this.data.formSize) < 0.002) {
        finish()
        return
      }
      this.setData({ formSize: next }, finish)
    },

    refit() {
      if (!this.data.show) {
        return
      }
      this.readCard((cardHeight) => {
        if (!cardHeight || !this.data.show) {
          return
        }
        this.applyFormSize(this.sizeFromHeight(cardHeight), false)
      })
    },

    onSheetBlankTap() {
      if (this.data.typeIndex === 0) {
        return
      }
      if (!this.data.show) {
        return
      }
      this.triggerEvent('close')
    },

    onSheetSizeUpdate(e) {
      'worklet'
      const size = e.size || 0
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(size)
    },

    onNameInput(e) {
      const name = e.detail.value
      this.setData({
        name,
        suggestions: this.buildSuggestions(this.data.typeIndex, name)
      }, () => this.refit())
    },

    onSuggestion(e) {
      const name = e.currentTarget.dataset.name
      const typeIndex = this.data.typeIndex
      if (typeIndex !== 0) {
        const suggestions = this.data.suggestions.map((item) => ({
          name: item.name,
          checked: item.name === name ? !item.checked : false
        }))
        const picked = suggestions.find((item) => item.checked)
        this.setData({
          name: picked ? picked.name : '',
          suggestions
        }, () => this.refit())
        return
      }
      const suggestions = this.data.suggestions.map((item) => ({
        name: item.name,
        checked: item.name === name ? !item.checked : false
      }))
      const picked = suggestions.find((item) => item.checked)
      const nextName = picked ? picked.name : ''
      const nextSuggestions = nextName
        ? toChips(generateNeighborBuildings(nextName))
        : this.buildSuggestions(0, '', true)
      this.setData({
        name: nextName,
        suggestions: nextSuggestions
      }, () => this.refit())
    },

    onTag(e) {
      const name = e.currentTarget.dataset.name
      const tags = this.data.tags.map((item) => ({
        name: item.name,
        checked: item.name === name ? !item.checked : item.checked
      }))
      this.setData({ tags })
    },

    onAddPhoto() {
      const remain = 4 - this.data.photos.length
      if (remain <= 0) {
        return
      }
      wx.chooseMedia({
        count: remain,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const added = (res.tempFiles || []).map((item) => item.tempFilePath).filter(Boolean)
          const photos = this.data.photos.concat(added).slice(0, 4)
          const photoKeys = this.data.photoKeys.concat(added.map(() => '')).slice(0, 4)
          this.setData({ photos, photoKeys }, () => this.refit())
        }
      })
    },

    onPreviewPhoto(e) {
      const index = Number(e.currentTarget.dataset.index) || 0
      const urls = this.data.photos || []
      const current = urls[index]
      if (!current) {
        return
      }
      wx.previewImage({ current, urls })
    },

    onRemovePhoto(e) {
      const index = Number(e.currentTarget.dataset.index)
      this.setData({
        photos: this.data.photos.filter((_, i) => i !== index),
        photoKeys: this.data.photoKeys.filter((_, i) => i !== index)
      }, () => this.refit())
    },

    onDirection(e) {
      const direction = e.currentTarget.dataset.label
      this.setData({
        direction: this.data.direction === direction ? '' : direction
      })
    },

    onBack() {
      if (this.properties.editMarker && this.properties.editMarker.xId) {
        this.triggerEvent('close')
        return
      }
      this.triggerEvent('back')
    },

    onSave() {
      const name = (this.data.name || '').trim()
      if (this.data.typeIndex === 0 && name) {
        wx.setStorageSync('buildingName', name)
      }
      if (this.data.needName && !name) {
        wx.showToast({
          title: '请填写' + (this.data.label || '名称'),
          icon: 'none'
        })
        return
      }
      const picked = DIRECTIONS.find((item) => item.label === this.data.direction)
      this.triggerEvent('save', {
        typeIndex: this.data.typeIndex,
        typeName: this.data.typeName,
        name,
        direction: picked ? picked.icon : '',
        tags: this.data.tags.filter((item) => item.checked).map((item) => item.name),
        photos: this.data.photos,
        photoKeys: this.data.photoKeys,
        marker: this.properties.editMarker || null
      })
    }
  }
})
