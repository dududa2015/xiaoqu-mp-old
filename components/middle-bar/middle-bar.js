// components/middle-bar/middle-bar.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        position: {
            type: String,
            value: 'right'
        },
    },

    /**
     * 组件的初始数据
     */
    data: {
        text: '导航'
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onFoot() {
            if (this.data.text === '导航') {
                this.setData({
                    text: '停止'
                })
                this.triggerEvent('onFoot', true);
            } else {
                this.setData({
                    text: '导航'
                })
                this.triggerEvent('onFoot', false);
            }

        },
    }
})