// components/user-info-app/user-info-app.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        userInfo: {
            type: Object,
            value: {},
            observer(newVal, oldVal) {
                //userInfo对象为空，nickName为'点击登录'，如果有昵称则显示昵称
                let nickName = ''
                if (newVal) {
                    nickName = newVal.nickName || '小区楼号'
                } else {
                    nickName = '点击登录'
                }
                this.setData({
                    nickName
                })
                if (newVal) {
                    this.setData({
                        isVip: newVal.isVip,
                        isAdmin: newVal.isAdmin,
                        points: this.convertToWan(newVal.points),
                        markers: this.convertToWan(newVal.markers),
                        friends: this.convertToWan(newVal.friends),
                        deleted: this.convertToWan(newVal.deleted),
                        showRank: newVal.points > 0
                    })
                }
            }
        }
    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    /**
     * 组件的方法列表
     */
    methods: {
        toLogin() {
            wx.navigateTo({
                url: '/pages/my/login/login',
            })
        },
        showToast(event) {
            const {
                number,
                type
            } = event.currentTarget.dataset
            let title = ''
            switch (type) {
                case 'score':
                    title = `您的积分为${number}`
                    break;
                case 'marker':
                    title = `您标记了${number}个点`
                    break;
                case 'friend':
                    title = `您邀请了${number}个朋友`
                    break;
                case 'delete':
                    title = `您被删除了${number}个标记`
                    break;
                default:
                    title = '好像出错了'
                    break;
            }
            wx.showToast({
                title: title,
                icon: 'none'
            })
        },
        toMarkers(event) {
            if (getApp().globalData.userInfo) {
                const {
                    deleted
                } = event.currentTarget.dataset
                wx.navigateTo({
                    url: '/pages/my/markers/markers?deleted=' + deleted,
                })
            } else {
                wx.showModal({
                    title: '登录提示',
                    content: '需要先登录才能进行操作',
                    success(res) {
                        if (res.confirm) {
                            wx.navigateTo({
                                url: '/pages/my/login/login',
                            })
                        } else if (res.cancel) {
                            console.log('用户点击取消')
                        }
                    }
                })
            }
        },
        convertToWan(num) {
            if (num > 100000) {
                return (num / 10000).toFixed(1) + "万";
            } else if (num > 10000) {
                return (num / 10000).toFixed(2) + "万";
            }
            return num;
        },
    }
})