
var app = new Vue({
    el: '#app',
    
    data: {
        products: [
            {
                time: '2021-10-01', 
                name: '牙刷',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '电视',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '电脑',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '鞋子',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '牙膏',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '床',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '杯子',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
        ],
    },

    methods: {
        clickFinish: function() {
            window.location.href = "/orders/neworder.html"
        }
    },
    mounted: function() {
       
    }
})