

var app = new Vue({
    el: '#app',
    data: {
        password: '',
        newPassword: '',
        newPassword2: '',
    },

    methods: {
        submitForm: function() {
            //必须输入三个密码
            if (!this.password) {
                alert("origin password can't be empty")
                return
            }

            //新密码必须6个字符以上
            if (!this.newPassword) {
                alert("new password can't be empty")
                return
            }

            if (this.newPassword.length < 6) {
                alert("new password must contain 6 characters at least")
                return
            }

            //newPassword === newPassword2
            if (this.newPassword != this.newPassword2) {
                alert("new password must be the same")
                return
            }

            var payload = {userId: JSON.parse(Cookies.get('user')).userId, password: this.password, newPassword: this.newPassword}
            //提交表单
            axios.post('/changepassword',  payload).then(function(resp) {
                console.log(resp)
                if (resp.data.status == 0) {
                    alert('修改密码成功')
                } else {
  
                    alert(resp.data.message)
                }
            }).catch( function(err) {
                console.log(err)
            })

        }
    }, 

    mounted: function() {
        //this.loadProducts(ids)
    }
})
