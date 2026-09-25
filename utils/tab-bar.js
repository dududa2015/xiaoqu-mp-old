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
