ELEMENT.locale(ELEMENT.lang.en)

var app = new Vue({
    el: '#app',
    
    data: {
        title: 'εεεΊε­',
        totalCount: 0,
        requests: [],
        pageSize: 10,
        currentPage: 1,
        params: {soldStatus: ''},
        products: [],
        loading: true
    },

    methods: {
        computeTotal: function(prop) {
            return this.products.map(function(order) {
                if (!order[prop]) {
                    return 0
                }
                if (typeof order[prop] === 'string') {
                    return parseInt(order[prop])
                }
                return order[prop]
            }).reduce(function(a, b) {
                return a + b;
            }, 0)
        },
        totalUnsoldAmount: function() {
            return this.products.map(function(item) {
                return (item.sjrksl - item.soldQuantity) * item.price
            }).reduce(function(a, b) {
                return a + b;
            }, 0)
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
            axios.post("/searchproducts2", {params: queryObj})
                .then( function(jsonResp) {
                    //console.log("success");
                    var data = jsonResp.data
                    console.log(data)
                    hideLoading()
                    that.loading = false
                    if (data.status == 0) {
                        that.products = data.products
                        that.totalCount = data.totalCount
                    } else {
                        console.error("response status is FAIL");
                        alert("ζε‘ε¨θΏεε€±θ΄₯")
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
            queryObject.soldStatus = this.params.soldStatus
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
            this.params.soldStatus = ''
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