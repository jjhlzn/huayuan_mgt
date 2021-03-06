

var query = parse_query_string(window.location.search.substr(1, window.location.search.length - 1))
var id = query.id

var app = new Vue({
    el: '#app',
    components: {
        vuejsDatepicker,
        
    },
    data: {
        id: id,
        order: {
            products: [],
            fyje: 0
        },
        canAddPayment: false
    },

    methods: {
        computeTotal: function(prop) {
            return this.order.products.map(function(product) {
                if (!product[prop]) {
                    return 0
                }
                return product[prop]
            }).reduce(function(a, b) {
                return a + b;
            }, 0)
        },

        loadData: function(id) {
            var that = this
            axios.post('/getinboundorder', {id: id})
                .then( function(response) {
                    var data = response.data
                    console.log(data)
                    if (data.status == 0) {
                        that.order = data.order
                        let products = that.order.products
                        that.order.products.forEach(function(product){
                            product.amount = product.price * product.quantity
                        })
                   }
                })
                .catch(function(error){
                    console.error(error)
                })
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
                        alert('????????????')
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
            if (confirm('???????????????')) {
                    axios.post('/deletepayment', {id: item.id})
                        .then(function (response) {
                            console.log(response)
                            var success = response.data.status == 0
                            if (!success) {
                                alert('????????????')
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
                edit: true,
                currency: 'EUR',
                huilv: 0
            }
            this.order.payments.push(item)
        }
    
    }, 

    mounted: function() {
        let that = this
        //this.loadProducts(ids)
        console.log('before load data')
        axios.post('/checkcanaddpayment', {roleName: 'xx'}).then(function (response) {
            console.log(response)
            if (response.data.status == 0) {
                that.canAddPayment = response.data.canAddPayment
            }
        })
        this.loadData(this.id)
    }
})
