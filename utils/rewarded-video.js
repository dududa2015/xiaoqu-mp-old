const REWARDED_AD_VALID_MS = 72 * 60 * 60 * 1000

const STORAGE_KEYS = {
  communityDetail: 'communityDetailExpireAt',
  route: 'routeAdExpireAt'
}

function isRewardedAdActive(scene) {
  const key = STORAGE_KEYS[scene]
  if (!key) {
    return false
  }
  const expireAt = wx.getStorageSync(key) || 0
  return Date.now() < expireAt
}

function setRewardedAdExpire(scene) {
  const key = STORAGE_KEYS[scene]
  if (!key) {
    return
  }
  wx.setStorageSync(key, Date.now() + REWARDED_AD_VALID_MS)
}

module.exports = {
  REWARDED_AD_VALID_MS,
  isRewardedAdActive,
  setRewardedAdExpire
}
