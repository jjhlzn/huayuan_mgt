

var query = parse_query_string(window.location.search.substr(1, window.location.search.length - 1))
var id = query.id
var selectedStr = query.selectedproducts || ''
var ids = selectedStr.split('___')
var fromaddproducts = query.fromaddproducts
console.log('id:', id)
console.log('selected products:', ids)

var app = new Vue({
    el: '#app',
    components: {
        vuejsDatepicker
    },
    data: {
        title: '商品库存',
        clientName: '',
        seller: '',
        sellDate: '',
        products: [],
        images: [],
        id: id
    },

    methods: {
        goToSelectProduct: function() {
            var selectedProducts = this.products.map(function(product) {return product.productId})
            window.location.href = "/orders/select_products.html?id="+this.id+"&selectedproducts="+selectedProducts.join('___')
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

        loadData: function(id, productIds) {
            var that = this
            var url = '/getorder'
            if (fromaddproducts) {
                if (id) {
                    url = '/getorderandproducts'
                } else {
                    url = '/getproducts'
                }
                
            }  else {
                if (id) {
                    url = '/getorder'
                } else {
                    url = '/getproducts'
                }
                
            }
            console.log(url)
            axios.post(url, {id: id, productIds: productIds})
                .then( function(response) {
                    var data = response.data
                    console.log(data)
                    if (data.status == 0) {
                        if (url != '/getproducts') {
                            var order = data.order
                            that.products = order.products
                            that.clientName = order.clientName
                            that.sellDate = order.sellDate
                            that.seller = order.seller
                            that.images = order.images.map(function(item) { return {url: '/uploads/'+item.imageUrl, serverFileName: item.imageUrl}})     
                        } else {
                            that.products = data.products
                        }
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

        deleteItem: function(productId) {
            var products = this.products
            var list = []
            for(var i = 0; i <products.length; i++) {
                var product = products[i]
                if (product.id != productId) {
                    list.push(product)
                }
            }
            this.products = list
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

            if (!this.seller) {
                alert('必须填写销售员')
                return false
            }

            if (!this.sellDate) {
                alert('必须填写销售日期')
                return false
            }

            //验证图片是否已经上传
            var images = this.images
            for(var i = 0; i < images.length; i++) {
                if (images[i].localUrl && !images[i].serverFileName) {
                    alert('图片未上传完毕')
                    return false
                }
            }
            var params = {
                id: that.id, 
                products: that.products,
                images: that.images.map(item => item.serverFileName),
                clientName: that.clientName,
                seller: that.seller,
                sellDate: that.sellDate
            }
            console.log(params)
            //提交订单
            axios.post('/updateorder', params ).then(function (response) {
                var data = response.data
                console.log(data)
                if (data.status == 0) {
                    that.id = data.id
                    that.products.forEach(function (product) {product.hasInOrder = true})
                    //that.rebindProducts()
                    var products = that.products.map(function (product) {return product.productId})
                    window.location.href = "/orders/neworder.html?id=" + that.id + "&selectedproducts="+products.join('___')
                    alert('operate successful!')
                } else {
                    alert('operate fail!')
                }
            })

            
        },

        rebindProducts() {
            var newProducts = []
            for(var i = 0; i < this.products.length; i++) {
                newProducts.push(this.products[i])
            }
            this.products = newProducts
        }
    }, 

    mounted: function() {
        //this.loadProducts(ids)
        console.log('before load data')
        this.loadData(this.id, ids)
    }
})

