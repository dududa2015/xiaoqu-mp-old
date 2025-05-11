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
                if (newVal.openId || newVal.appleId) {
                    nickName = newVal.nickName || '小区楼号'
                } else {
                    newVal = {}
                    nickName = '点击登录'
                }
                this.setData({
                    nickName
                })
                this.setData({
                    points: this.convertToWan(newVal ? newVal.points : 0),
                    markers: this.convertToWan(newVal ? newVal.markers : 0),
                    friends: this.convertToWan(newVal ? newVal.friends : 0),
                    deleted: this.convertToWan(newVal ? newVal.deleted : 0),
                    showVip: new Date(newVal.iosVipExpiredDate) > new Date() || new Date(newVal.androidVipExpiredDate) > new Date(),
                    vipExpiredDate: this.formatDate(newVal.iosVipExpiredDate) || this.formatDate(newVal.androidVipExpiredDate)
                })
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
        //登录或者编辑
        toLogin() {
            let userInfo = wx.getStorageSync('userInfo')
            let token = wx.getStorageSync('token')
            if (userInfo.openId || userInfo.appleId) {
                wx.navigateTo({
                    url: '/pages/my/edit/edit',
                })
            } else {
                wx.navigateTo({
                    url: '/pages/my/login/login',
                })
            }
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
            let userInfo = wx.getStorageSync('userInfo')
            if (userInfo) {
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
            } else {
                return num || 0
            }
        },
        formatDate(datetimeStr) {
            if (datetimeStr) {
                const dateObj = new Date(datetimeStr); // 解析为 Date 对象
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // 月份从 0 开始，补零
                const day = String(dateObj.getDate()).padStart(2, "0"); // 补零
                return `${year}-${month}-${day}`;
            } else {
                return ''
            }
        }
    }
})