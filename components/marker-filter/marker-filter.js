Component({
    data: {
        tagList: ['所有的', "我的"],
        checkedIndex: 0,
    },
    methods: {
        onCheck(event) {
            let checkedIndex = event.currentTarget.dataset.index
            if (this.data.checkedIndex !== checkedIndex) {
                this.setData({
                    checkedIndex
                })
                this.triggerEvent('getCheckedIndex', checkedIndex)
            }
        }
    }
});
