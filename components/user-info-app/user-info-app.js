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