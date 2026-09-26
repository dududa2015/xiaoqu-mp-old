/** 让页面安全地设置自定义底栏，底栏还没挂上时直接返回。 */

/** 地图页选 0，我的页选 1。 */
function setTabBarSelected(page, selected) {
  if (!page || typeof page.getTabBar !== 'function') {
    return
  }
  page.getTabBar((instance) => {
    if (!instance) {
      return
    }
    if (typeof instance.setSelected === 'function') {
      instance.setSelected(selected)
      return
    }
    instance.setData({ selected })
  })
}

/** 弹层打开时隐藏底栏。 */
function setTabBarHidden(page, hidden) {
  if (!page || typeof page.getTabBar !== 'function') {
    return
  }
  page.getTabBar((instance) => {
    if (!instance || typeof instance.setHidden !== 'function') {
      return
    }
    instance.setHidden(hidden)
  })
}

module.exports = {
  setTabBarSelected,
  setTabBarHidden
}
