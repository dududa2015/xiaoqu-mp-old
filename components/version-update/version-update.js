// components/version-update/version-update.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        showVersionUpdate: {
            type: Boolean,
            value: false,
        },
        iosContent: {
            type: String,
            value: '',
            observer(newVal, oldVal) {
                this.setData({
                    contentList: newVal.replace(/;/g, '\n').replace(/；/g, '\n')
                })
            }
        },
        iosForceUpdate:{
          type: Boolean,
          value: false
        },
        androidContent: {
            type: String,
            value: '',
            observer(newVal, oldVal) {
                this.setData({
                    contentList: newVal.replace(/;/g, '\n').replace(/；/g, '\n')
                })
            }
        },
        androidForceUpdate:{
          type: Boolean,
          value: false
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
        onUpdate() {
            wx.miniapp.jumpToAppStore({
                success: (res) => {
                    console.log('success:', res);
                    this.setData({
                        showVersionUpdate:false
                    })
                },
                fail: (res) => {
                    console.log('fail:', res);
                }  
            });
        },
        onCancel(){
            this.setData({
                showVersionUpdate:false
            })
        }
    }
})