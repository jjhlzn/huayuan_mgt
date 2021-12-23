var query = parse_query_string(window.location.search.substr(1, window.location.search.length - 1))
var id = query.id
var ids = []

var app = new Vue({
    el: '#app',
    data: {
        title: '商品库存',
        clientName: '',
        products: [
        ],
        images: [],
        id: id
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

        loadProducts: function(ids) {
            var that = this
            axios.post('/getproducts', {ids: ids})
                .then(function(response)  {
                    var data = response.data
                    console.log(data)
                    if (data.status == 0){
                        that.products = data.products
                    }
                })
                .catch(function(error){
                    console.error(error)
                })
        },

        onFileChange(e) {
            var file = e.target.files[0];
            console.log(file)
            var url = URL.createObjectURL(file);
            console.log(url)
            this.images.push({url: url, file: file, localUrl: url, serverFileName: ''})
            this.uploadImage(url, file)
        },

        setServerFileName: function(url, serverFileName) {
            var images = this.images
            for(var i = 0; i < images.length; i++) {
                if (images[i].localUrl == url){
                    images[i].serverFileName = serverFileName
                }
            }
        },

        uploadImage: function(url, file) {
            var that = this
            var formData = new FormData();
            formData.append("photo", file);
            axios.post('/upload', formData)
                .then( function(response) {
                    if (response.status == 200) {
                        //console.log(response)
                        var data = response.data
                        var fileName = data.filename
                        that.setServerFileName(url, fileName)
                        console.log(data)
                    } else {
                        alert('上传图片失败')
                    }
                    
                }).catch(function(error){
                    console.error(error)
                })
        },

        submitOrder: function() {
            var that = this

            //客户名称必须有
            if (!this.clientName) {
                alert('必须填写客户名称')
                return false
            }

            var products = this.products
            for(var i = 0; i < products.length; i++) {
                if (!products[i].price) {
                    alert('必须填写价格')
                    return false
                }

                if (!products[i].buyQuantity) {
                    alert('必须填写数量')
                    return false
                }
            }

            //验证图片是否已经上传
            var images = this.images
            for(var i = 0; i < images.length; i++) {
                if (images[i].localUrl && !images[i].serverFileName) {
                    alert('图片未上传完毕')
                    return false
                }
            }
            
            //提交订单
            axios.post('/updateorder', {
                id: that.id, 
                products: that.products,
                images: that.images.map(item => item.serverFileName),
                clientName: that.clientName,
            }).then(function (response) {
                var data = response.data
                console.log(data)
                if (data.status == 0) {
                    that.id = data.id
                    alert('create order successful!')
                } else {
                    alert('create order fail!')
                }
            })

            
        }
    }, 
    mounted: function() {
        this.loadProducts(ids)
    }
})