import {
    getUserInfo,
    getAppleUserInfo
} from './apis/user-api'
App({
    onLaunch(options) {
        // #if MP
        //自动更新，非必要不调用
        this.autoUpdate()
        this.login(options.query.userId)
        // #else
        this.appInit()
        this.appleLogin()
        // #endif
    },
    //登录获取用户信息
    login(friendUserId) {
        // friendUserId = '92918a62b30c43479f501c056905dd08'
        // if (wx.getStorageSync('userId') === "") {
        // 登录
        wx.login({
            success: res => {
                getUserInfo({
                    code: res.code,
                    userId: wx.getStorageSync('userId'),
                    friendUserId: friendUserId ?? ''
                }).then(res => {
                    wx.setStorageSync('userId', res.userId)
                    wx.setStorageSync('token', res.token)
                    wx.setStorageSync('userInfo', res)
                }).catch(err => {
                    wx.showModal({
                        title: '请求错误',
                        content: JSON.stringify(err),
                        showCancel: false
                    })
                })
            }
        })
        // }
    },
    //用缓存里的userId重新获取用户信息并生成token
    appleLogin() {
        let userId = wx.getStorageSync('userId')
        console.log(new Date().toLocaleDateString() + ' ' + new Date().toTimeString(), userId)
        if (userId) {
            getAppleUserInfo({
                userId
            }).then(res => {
                console.log(res)
                wx.setStorageSync('userId', res.userId)
                wx.setStorageSync('token', res.token)
                wx.setStorageSync('userInfo', res)
            })
        }
    },
    appInit(){
        //第一次启动的时候写入installDate
        if(wx.getStorageSync('installDate') === ''){
            wx.setStorageSync('installDate', new Date())
        }        
    },
    //自动更新
    autoUpdate() {
        console.log('update begin')
        //更新
        const updateManager = wx.getUpdateManager()

        updateManager.onCheckForUpdate(function (res) {
            // 请求完新版本信息的回调
            console.log('onCheckForUpdate', res.hasUpdate)
        })

        updateManager.onUpdateReady(function () {
            console.log('更新中')
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                success: function (res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate()
                    }
                }
            })
        })
        // 新版本下载失败
        updateManager.onUpdateFailed(function () {
            console.log('onUpdateFailed')
        })
    },
    globalData: {
        userInfo: null,
        mapCtx: null,
        currentPolylineIndex: 0,
        isAndroid: false,
        padding: 3
    }
})