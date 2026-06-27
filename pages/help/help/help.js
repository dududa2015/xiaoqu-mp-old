// pages/help/help/help.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showNavMenu: false, // 是否显示导航菜单
    navItems: [
      { id: 'intro', name: '文档说明', icon: '📄' },
      { id: 'overview', name: '功能概述', icon: '✨' },
      { id: 'basic', name: '基础操作', icon: '📱' },
      { id: 'search', name: '搜索功能', icon: '🔍' },
      { id: 'share', name: '分享功能', icon: '📤' },
      { id: 'settings', name: '设置功能', icon: '⚙️' },
      { id: 'marker', name: '标记管理', icon: '📍' },
      { id: 'navigation', name: '步行导航', icon: '🧭' },
      { id: 'map-type', name: '地图类型', icon: '🗺️' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 跳转到问题解答页面
   */
  goToHelpDetail() {
    wx.navigateTo({
      url: '/pages/help/question/question'
    })
  },

  /**
   * 切换导航菜单显示
   */
  toggleNavMenu() {
    this.setData({
      showNavMenu: !this.data.showNavMenu
    });
  },

  /**
   * 跳转到指定章节
   */
  scrollToSection(e) {
    const sectionId = e.currentTarget.dataset.id;

    // 关闭导航菜单
    this.setData({
      showNavMenu: false
    });

    // 延迟执行，确保菜单关闭动画完成后再滚动
    setTimeout(() => {
      // 优先使用 selector 方式，这是小程序推荐的方式
      wx.pageScrollTo({
        selector: `#${sectionId}`,
        duration: 300,
        offsetTop: -20 // 距离顶部20px的偏移
      }).catch(err => {
        console.error('selector方式滚动失败，尝试计算方式:', err);
        // 备用方案：使用计算方式
        const query = wx.createSelectorQuery().in(this);

        query.select(`#${sectionId}`).boundingClientRect();
        query.selectViewport().scrollOffset();

        query.exec((res) => {
          if (res && res[0] && res[1]) {
            const rect = res[0];
            const scrollInfo = res[1];

            if (rect) {
              const targetScrollTop = scrollInfo.scrollTop + rect.top - 40;

              wx.pageScrollTo({
                scrollTop: Math.max(0, targetScrollTop),
                duration: 300
              });
            }
          }
        });
      });
    }, 200);
  }
})