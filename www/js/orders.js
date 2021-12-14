
var app = new Vue({
    el: '#app',
    data: {
        products: [
            {
                orderNo: '123456789ABC', 
                customer: '谷歌',
                sellDate: '2021-10-12',
                seller: '张三',
                
            },
            {
                orderNo: '123456789ABC', 
                customer: '苹果',
                sellDate: '2021-10-12',
                seller: '李四',
                
            },
            {
                orderNo: '123456789ABC', 
                customer: '微软',
                sellDate: '2021-10-12',
                seller: '乔布斯',
                
            },
        ],
    },

    methods: {
        clickDetail: function(orderNo) {
            window.location.href = "/orders/neworder.html"
        }
    },
    mounted: function() {

    }
})