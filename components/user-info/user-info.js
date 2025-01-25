// components/user-info/user-info.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        userInfo: {
            type: Object,
            value: {},
            observer(newVal, oldVal) {
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
        onChooseAvatar(e) {
            const { avatarUrl } = e.detail
            this.setData({
                avatarUrl,
            })
        },
        onAvatarTap() {
            wx.showToast({
                title: '当前版本：v5.0',
                icon: 'none'
            })
        },
        toEdit() {
            wx.navigateTo({
                url: '/pages/my/edit/edit',
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