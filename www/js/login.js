
var app = new Vue({
    el: '#app',
    data: {
        username_error: false,
        password_erorr: false,
        login_error: false,
        userId: '',
        password: '',
        errorMessage: '密码错误'
    },

    methods: {
        login: function() {
            //this.login_error = true
            var that = this
            var payload = { userId: this.userId, password: this.password}
            axios.post('/login',  payload).then(function(resp) {
                console.log(resp)
                if (resp.data.status == 0) {
                    var token = resp.data.token
                    var userInfo = resp.data.userInfo
                    Cookies.set('token', token)
                    Cookies.set('user', JSON.stringify(userInfo))
                    window.location.href = "/products/list.html"
                } else {
                    that.login_error = true
                    that.errorMessage =  resp.data.errorMessage
                }
            }).catch( function(err) {
                console.log(err)
            })
           
        },
        checkHasLogin: function() {
            var token = Cookies.get('token')
            if (token) {
                //check token is 
                axios.post('/checktoken').then(function(resp) {
                    window.location.href = "/products/list.html"
                }).catch(function(err) {
                
                })
            }
        }
    },
    mounted: function() {
        this.checkHasLogin()
    }
})