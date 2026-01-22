Component({
    properties: {
        showVipExpired: {
            type: Boolean,
            value: false,
        },
        content: {
            type: String,
            value: '',
        }
    },

    data: {
        countdown: 50,
        rightsList: [
            { icon: '/images/index/svgs/ban.svg', title: '无广告体验', desc: '畅享纯净地图' },
            { icon: '/images/index/svgs/map.svg', title: '个人地图', desc: '自定义标记点' },
            { icon: 'navigation', title: '导航功能', desc: '精准路线规划' },
            { icon: 'share', title: '位置共享', desc: '实时位置同步' },
            { icon: 'cube', title: '3D地图', desc: '立体视角浏览' }
        ]
    },

    lifetimes: {
        attached() {
            this.startCountdown()
        },
        detached() {
            this.clearCountdown()
        }
    },

    observers: {
        'showVipExpired': function (newVal) {
            if (newVal) {
                this.startCountdown()
            } else {
                this.clearCountdown()
            }
        }
    },

    methods: {
        startCountdown() {
            this.clearCountdown()
            this.setData({
                countdown: 50
            })
            this.timer = setInterval(() => {
                const countdown = this.data.countdown - 1
                if (countdown <= 0) {
                    this.clearCountdown()
                    this.navigateToMy()
                } else {
                    this.setData({
                        countdown
                    })
                }
            }, 1000)
        },

        clearCountdown() {
            if (this.timer) {
                clearInterval(this.timer)
                this.timer = null
            }
        },

        navigateToMy() {
            this.setData({
                showVipExpired: false
            })
            wx.switchTab({
                url: '/pages/my/index/index'
            })
        },

        onRenewNow() {
            this.clearCountdown()
            this.navigateToMy()
        }
    }
})
