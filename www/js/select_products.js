var query = parse_query_string(window.location.search.substr(1, window.location.search.length - 1))
var id = query.id || ''
var selectedStr = query.selectedproducts || ''
var ids = selectedStr.split('___')
console.log('id:', id)
console.log('selected products:', ids)

var app = new Vue({
    el: '#app',
    
    data: {
        title: '商品库存',
        totalCount: 0,
        requests: [],
        pageSize: 10,
        currentPage: 1,
        params: {},
        products: [],
        loading: true,
        id: id,
        selectedProducts: ids
    },

    methods: {
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
            axios.post("/searchproducts", {params: queryObj})
                .then( function(jsonResp) {
                    //console.log("success");
                    var data = jsonResp.data
                    console.log(data)
                    hideLoading()
                    that.loading = false
                    if (data.status == 0) {
                        that.setSelected(data.products)
                        that.products = data.products
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
            e.preventDefault()
            console.log("send search request")
            this.fetchData()
            
        },
        clickReset: function(e) {
            console.log("send reset")
            this.params.keyword = ''
            e.preventDefault()
        },
        clickFinish: function() {
            var selectedProducts = this.selectedProducts

            window.location.href = "/orders/neworder.html?fromaddproducts=true&id=" + this.id + "&selectedproducts="+selectedProducts.join('___')
        },

        setSelected: function(products) {
            var selectedProducts = this.selectedProducts
            for(var i = 0; i < products.length; i++) {
                if (selectedProducts.indexOf(products[i].id) != -1) {
                    products[i].selected = true
                }
            }
        },

        addToOrder: function(id) {
            this.selectedProducts.push(id)
            var products = this.products
            var list = []
            for(var i = 0; i < products.length; i++) {
                if (products[i].id == id) {
                    products[i].selected = true
                }
                list.push(products[i])
            }
            this.products = list
            console.log(this.selectedProducts)
        },

        removeFromOrder: function(id) {
            console.log(this.selectedProducts)
            console.log("remove " + id)
            const index = this.selectedProducts.indexOf(id)
            if (index > -1) {
                this.selectedProducts.splice(index, 1);
                console.info("delete success")
            }
            var products = this.products
            var list = []
            for(var i = 0; i < products.length; i++) {
                if (products[i].id == id) {
                    products[i].selected = false
                }
                list.push(products[i])
            }
            this.products = list
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