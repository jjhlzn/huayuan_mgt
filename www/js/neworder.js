
var app = new Vue({
    el: '#app',
    
    data: {
        title: '商品库存',
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
        ],
        images: ['/images/test1.jpg', '/images/test2.jpg']
    },

    methods: {
        goToSelectProduct: function() {
            window.location.href = "/orders/select_products.html"
        },
        deleteImage: function(index) {
            //alert("remove image " + index )
            var list = []
            for(var i =0; i < this.images.length; i++) {
                if (index != i) {
                    list.push(this.images[i])
                }
            }
            this.images = list
        },

    },
    mounted: function() {

    }
})