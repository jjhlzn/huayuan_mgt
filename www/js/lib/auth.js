function checkLogin() {
    var token = Cookies.get('token')
    if (!token || token === 'null') {
        window.location.href = '/login.html'
    }
}

function checkAuth(resp) {
    if (resp.status == 401) {
        window.location.href = '/login.html'
        return
    }
}

checkLogin()