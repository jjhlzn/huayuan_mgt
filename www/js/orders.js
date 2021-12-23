
var app = new Vue({
    el: '#app',
    data: {
        totalCount: 0,
        requests: [],
        pageSize: 10,
        currentPage: 1,
        params: {},
        orders: [],
        loading: true
    },

    methods: {
        clickDetail: function(id) {
            window.location.href = "/orders/neworder.html?id="+id
        },
        clickModify: function(id) {
            window.location.href = "/orders/neworder.html?id="+id
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