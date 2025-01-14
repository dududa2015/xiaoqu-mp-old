// components/check-tag/check-tag.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        tagList: {
            type: Object,
            value: {}
        }
    },

    /**
     * 组件的初始数据
     */
    data: {

        checkedIndex: 0,
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onCheck(event) {
            let checkedIndex = event.currentTarget.dataset.index
            this.setData({
                checkedIndex
            })
        }
    }
})