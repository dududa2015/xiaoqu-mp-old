// components/marker-add-grid/marker-add-grid.js
Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    pointList: [{
      icon: 'location-enlargement',
      bgcolor: '#0074FE',
      name: '楼号'
    }, {
      icon: 'dam-1',
      bgcolor: '#E85827',
      name: '出入口'
    }, {
      icon: '/images/grid/wc.png',
      iconType: 'png',
      bgcolor: '#8c444f',
      name: '公厕'
    }, {
      icon: 'shop-5',
      bgcolor: '#8c444f',
      name: '维修点'
    }, {
      icon: 'battery-add',
      bgcolor: '#8c444f',
      name: '换电站'
    }, {
      icon: 'archway',
      bgcolor: '#8c444f',
      name: '外卖柜'
    }, {
      icon: '/images/grid/life.png',
      bgcolor: '#8c444f',
      name: '生活类'
    }, {
      icon: 'street-road-1',
      bgcolor: '#3CB371',
      name: '道路'
    }, {
      icon: '/images/grid/fence.png',
      bgcolor: '#dc143c',
      name: '围墙'
    }],
    lineList: [
      // {
      //   icon: 'street-road-1',
      //   bgcolor: '#3CB371',
      //   name: '通道'
      // }, {
      //   icon: '/images/road-no.png',
      //   bgcolor: '#FF0000',
      //   name: '断头路'
      // }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChoose(event) {
      const index = event.currentTarget.dataset.index
      this.triggerEvent('getMarkerTypeIndex', index)
    },
    toPersonalMap(){
        wx.setStorageSync('isPersonalMap', true)
        this.triggerEvent('createPersonalMap', true)
        // wx.navigateTo({
        //   url: '/pages/personal/list/list',
        // })
    }
  }
})