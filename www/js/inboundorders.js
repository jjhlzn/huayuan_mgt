ELEMENT.locale(ELEMENT.lang.en)

var app = new Vue({
    el: '#app',
    data: {
        totalCount: 0,
        requests: [],
        pageSize: 10,
        currentPage: 1,
        params: {
            payState: '',
            days: '',
        },
        orders: [],
        loading: true
    },

    methods: {
        computeTotal: function(prop) {
            return this.orders.map(function(order) {
                if (!order[prop]) {
                    return 0
                }
                return order[prop]
            }).reduce(function(a, b) {
                return a + b;
            }, 0)
        },
        clickDetail: function(id) {
            window.open("/inboundorders/order.html?id="+id, "_blank")
            //window.location.href = 
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
            axios.post("/searchinboundorders", {params: queryObj})
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
            queryObject.payState =  this.params.payState
            queryObject.days = this.params.days
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
            this.params.days = ''
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