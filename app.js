import {
    getUserInfo,
    getAppleUserInfo
} from './apis/user-api'
App({
    onLaunch(options) {
        // #if MP
        //自动更新，非必要不调用
        this.tryTimes = 3 //login登录失败重试次数
        this.autoUpdate()
        this.login(options.query.userId)
        // #else
        this.appInit()
        this.getDeviceId()
        this.appleLogin()
        // #endif
    },
    //登录获取用户信息
    login(friendUserId) {
        this.tryTimes -= 1
        console.log('this.tryTimes', this.tryTimes)
        if (this.tryTimes <= 0) return
        // 登录
        let userId = wx.getStorageSync('userId')
        if (userId === '') {
            wx.login({
                success: res => {
                    if (res.code) {
                        this.getMPUserInfo(res.code, '', friendUserId)
                    } else {
                        this.login()
                    }
                },
                fail(err) {
                    this.login()
                }
            })
        } else {
            this.getMPUserInfo('', userId, friendUserId)
        }
        // }
    },
    getMPUserInfo(code, userId, friendUserId) {
        getUserInfo({
            code,
            userId,
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
    appInit() {
        //第一次启动的时候写入installDate
        if (wx.getStorageSync('installDate') === '') {
            wx.setStorageSync('installDate', new Date().getTime())
        }
        console.log('app init', wx.getStorageSync('installDate'))
    },
    //获取设备id
    getDeviceId() {
        const start = Date.now();
        wx.miniapp.loadNativePlugin({
            pluginId: "wx033a6b34f2c7ea15",
            success(myPlugin) {
                console.log('启动插件成功', myPlugin)
                // 调用插件接口
                // #if IOS
                const IDFV = myPlugin.getIdentifierForVendor()
                console.log('ios plugin', IDFV)
                // #elif ANDROID
                const ret = myPlugin.getAndroidId({})
                console.log('android plugin', ret)
                // #endif
                const end = Date.now(); 
                console.log(`getDeviceId 耗时：${end - start}ms`);
                // ios plugin 20C13C69-B33C-4641-8074-C2F438A28430
            },
            fail(err) {
                console.log('启动插件失败')
                const end = Date.now(); 
                console.log(`getDeviceId 耗时：${end - start}ms`);
                // 启动插件失败
            }
        })
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