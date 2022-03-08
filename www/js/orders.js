ELEMENT.locale(ELEMENT.lang.en)

var app = new Vue({
    el: '#app',
    data: {
        totalCount: 0,
        requests: [],
        pageSize: 10,
        currentPage: 1,
        params: {payState: ''},
        orders: [],
        loading: true
    },

    methods: {
        clickDetail: function(id) {
            //window.location.href = "/orders/neworder.html?id="+id
            window.open("/orders/neworder.html?id="+id, '_blank')
        },
        clickModify: function(id) {
            //window.location.href = "/orders/neworder.html?id="+id
            window.open("/orders/neworder.html?id="+id, '_blank')
        },
        clickDelete: function(id) {
            var that = this
            if (window.confirm("Do you want delet this order?")) {
                axios.post('/deleteorder', {id: id})
                .then(function(response) {
                    var data = response.data
                    console.log(data)
                    if (data.status == 0) {
                        var list = []
                        for(var i  = 0; i < that.orders.length; i++) {
                            var order = that.orders[i]
                            if (order.ckdh != id) {
                                list.push(order)
                            }
                        }
                        that.orders = list
                    }
                })
            }

            
        },
        handleCurrentChange: function(pageNo) {
            console.log(pageNo)
            this.currentPage = pageNo
            this.fetchData()
        },


        clickNewOrder: function() {
            window.location.href = "/orders/select_products.html"
        },

        fetchData: function() {
            //showLoading();
            var that = this
            var queryObj = this.getQueryObj()
            console.log(JSON.stringify(queryObj))
            showLoading()
            that.loading = true
            axios.post("/searchorders", {params: queryObj})
                .then( function(jsonResp) {
                    //console.log("success");
                    var data = jsonResp.data
                    console.log(data)
                    hideLoading()
                    that.loading = false
                    if (data.status == 0) {
                        that.orders = data.orders
                        that.totalCount = data.totalCount
                    } else {
                        console.error("response status is FAIL");
                        alert("服务器返回失败")
                    }
                })
                .catch(function(error) {
                    console.error(error)
                })
        },

        getQueryObj: function() {
            var queryObject = { }
            queryObject.pageNo = this.currentPage
            queryObject.pageSize = this.pageSize
            queryObject.keyword = this.params.keyword
            queryObject.payState = this.params.payState
            return queryObject;
        },

        clickSearch: function(e) {
            console.log("send search request")
            this.fetchData()
            e.preventDefault()
        },
        clickReset: function(e) {
            console.log("send reset")
            this.params.keyword = ''
            this.fetchData()
            e.preventDefault()
        }
        
    },
    mounted: function() {
        this.fetchData()
    }
})

function showLoading() {
    $('#loading').show()
    //app.data.loading = true
}

function hideLoading() {
    $('#loading').hide()
    //app.data.loading = false
}