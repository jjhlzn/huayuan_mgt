

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
        sellDate: moment().format('YYYY-MM-DD'),
        products: [],
        images: [],
        id: id,
        xshth: '',
        state: '新制',
        order: {}
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
                            that.order = order
                            that.products = order.products
                            that.clientName = order.clientName
                            that.sellDate = order.sellDate
                            that.seller = order.seller
                            that.id = order.ckdh
                            that.state = order.state
                            that.xshth = order.xshth
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

       

        returnOrder: function() {
            this.submitOrder('新制')
        },

        chukuOrder: function() {
            this.submitOrder('出库')
        },

        jiesuanOrder: function() {
            this.submitOrder('已结算')
        },
        
        saveOrder: function() {
            this.submitOrder()
        },

        submitOrder: function(newState) {
            var that = this

            //客户名称必须有
            if (!this.clientName) {
                alert('必须填写客户名称')
                return false
            }

            if (!this.xshth) {
                alert('必须填写订单号')
                return false
            }

            var products = this.products
            for(var i = 0; i < products.length; i++) {
                if (!products[i].price) {
                    alert('必须填写价格')
                    return false
                }

                if (!isNumeric(products[i].price)) {
                    alert('价格必须是数字')
                    return false
                }

                if (!products[i].buyQuantity) {
                    alert('必须填写数量')
                    return false
                }

                if (!isInteger(products[i].buyQuantity)) {
                    alert('数量必须是整数')
                    return false
                }

                if (products[i].buyQuantity <= 0) {
                    alert('quantity must be greater than zero')
                    return false
                }

                if (!products[i].currency) {
                    alert('please input currency')
                    return false
                }

                if (!isFloat(products[i].huilv)) {
                    alert('exchange rate must be number')
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
                sellDate: that.sellDate,
                xshth: that.xshth,
                state: newState ? newState : this.state,
            }
            console.log(params)
            //提交订单
            axios.post('/updateorder', params ).then(function (response) {
                var data = response.data
                console.log(data)
                if (data.status == 0) {
                    //服务器保存成功，更新新状态
                    if (newState) {
                        that.state = newState
                    }
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
        },



        pressEdit: function (seq) {
            console.log('handle press edit');
            var items = this.order.payments
            var newItems = []
            for(var i = 0; i < items.length; i++) {
                var item = items[i];
                if (i == seq) {
                    item.edit = true
                }
                newItems.push(item)
            }
            this.order.payments = newItems
        },
        confirmEdit: function(seq) {
            let that = this
            var item = this.order.payments[seq]
            if (!isFloat(item.huilv)) {
                alert('Exchange Rate must be number')
                return
            }
            axios.post('/updatepayment', item)
                .then(function (response) {
                    console.log(response)
                    var success = response.data.status == 0
                    if (!success) {
                        alert('操作失败')
                        return
                    }
                    var id = response.data.id
                    var items = that.order.payments
                    var newItems = []
                    for(var i = 0; i < items.length; i++) {
                        var item = items[i];
                        if (i == seq) {
                            item.edit = false
                            item.id = id
                        }
                        newItems.push(item)
                    }
                    app.order.payments = newItems
            })
            
        },
        cancelEdit: function(seq) {
            if (this.order.payments[seq].id) {
                var items = this.order.payments
                var newItems = []
                for(var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (i == seq) {
                        item.edit = false
                    }
                    newItems.push(item)
                }
                this.order.payments = newItems
            } else {
                //this.deleteItem(seq)
                app.order.payments.splice(seq, 1);
            }
        },
        deleteItem: function(seq) {
            var item = this.order.payments[seq]
            if (confirm('确定删除吗')) {
                    axios.post('/deletepayment', {id: item.id})
                        .then(function (response) {
                            console.log(response)
                            var success = response.data.status == 0
                            if (!success) {
                                alert('操作失败')
                                return
                            }
                            app.order.payments.splice(seq, 1);
                })
            }
        },
        newItemClick: function() {
            var item = {
                id: '',
                dh: this.id,
                addtime: moment().format('YYYY-MM-DD'),
                amount: 0,
                tdh: '',
                edit: true,
                currency: 'USD',
                huilv: 0
            }
            this.order.payments.push(item)
        }
    }, 

    mounted: function() {
        //this.loadProducts(ids)
        console.log('before load data')
        this.loadData(this.id, ids)
    }
})

function isNumeric(str) {
    //if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function isInteger(str) {
    //if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseInt(str)) // ...and ensure strings of whitespace fail
}
