
var app = new Vue({
    el: '#app',
    
    data: {
        title: '商品库存',
        totalCount: 1008,
        requests: [],
        pageSize: 20,
        currentPage: 1,
        params: {},
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
            /*
            {
                time: '2021-10-01', 
                name: '耳机',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '冰箱',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '椅子',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '桌子',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            },
            {
                time: '2021-10-01', 
                name: '笔',
                code: 'ABC',
                spec: '12*10',
                quantity: 100,
                price: '98.5'
            } */
        ],
    },

    methods: {
        handleCurrentChange: function(pageNo) {
            console.log(pageNo)
            this.currentPage = pageNo
           // this.fetchData()
        },

        clickNewOrder: function() {
            window.location.href = "/orders/select_products.html"
        }
    },
    mounted: function() {

    }
})