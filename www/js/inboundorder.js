

var query = parse_query_string(window.location.search.substr(1, window.location.search.length - 1))
var id = query.id

var app = new Vue({
    el: '#app',
    components: {
        vuejsDatepicker,
        
    },
    data: {
        id: id,
        order: {}
    },

    methods: {
        

        loadData: function(id) {
            var that = this
            axios.post('/getinboundorder', {id: id})
                .then( function(response) {
                    var data = response.data
                    console.log(data)
                    if (data.status == 0) {
                        that.order = data.order
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
                edit: true,
            }
            this.order.payments.push(item)
        }
    
    }, 

    mounted: function() {
        //this.loadProducts(ids)
        console.log('before load data')
        this.loadData(this.id)
    }
})
