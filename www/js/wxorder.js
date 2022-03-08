
var query = parse_query_string(window.location.search.substr(1, window.location.search.length - 1))
var id = query.id
console.log('id = ' + id)
var app = new Vue({
    el: '#app',
    
    data: {
        order: {}
    },

    methods: {
       

        loadData: function() {
            var that = this
            axios.post('/getwxorder', {id: id})
                .then( function(response) {
                    var data = response.data
                    console.log(data)
                    if (data.status == 0) {
                        that.order = response.data.order
                   }
                })
                .catch(function(error){
                    console.error(error)
                })
        },

   
    }, 

    mounted: function() {

        this.loadData()
    }
})
