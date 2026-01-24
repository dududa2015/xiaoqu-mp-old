Component({
    properties: {
        showVipExpired: {
            type: Boolean,
            value: false,
        },
        type: {
            type: String,
            value: 'expired', // 'expired': 会员到期, 'need': 需要开通会员
        },
        content: {
            type: String,
            value: '',
        }
    },

    data: {
        countdown: 10,
        title: '',
        tipText: '',
        buttonText: ''
    },

    lifetimes: {
        attached() {
            this.updateTexts()
            if (this.properties.showVipExpired) {
                this.startCountdown()
            }
        },
        detached() {
            this.clearCountdown()
        }
    },

    observers: {
        'showVipExpired': function (newVal) {
            if (newVal) {
                this.updateTexts()
                this.startCountdown()
            } else {
                this.clearCountdown()
            }
        },
        'type': function () {
            if (this.properties.showVipExpired) {
                this.updateTexts()
            }
        }
    },

    methods: {
        updateTexts() {
            const type = this.properties.type || 'expired'
            const texts = type === 'expired' 
                ? {
                    title: '会员已过期',
                    tipText: '此功能仅限会员使用，立即续费解锁',
                    buttonText: '立即续费'
                }
                : {
                    title: '开通会员',
                    tipText: '开通会员即可使用全部功能，立即解锁',
                    buttonText: '立即开通'
                }
            
            this.setData({
                title: texts.title,
                tipText: this.properties.content || texts.tipText,
                buttonText: texts.buttonText
            })
        },

        startCountdown() {
            this.clearCountdown()
            this.setData({
                countdown: 10
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
