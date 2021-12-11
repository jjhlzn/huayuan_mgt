
Vue.component('user-header', {
    data: function() {
        return {
            user: {}
        }
    },
    methods: {
        logout: function() {
            Cookies.remove('token')
            window.location.href = "/login.html"
        },
    },
    mounted: function() {
        var user = Cookies.get('user')
        if (user) {
            this.user = JSON.parse(user)
        }

        $('#menuButton').click(function() {
            console.log('menu click')
            $('#menu').toggleClass('-translate-x-full')
        })
    },
    template: `
    <div id="header" class="flex flex-row-reverse bg-white justify-between">
        
        <div class="dropdown inline-block relative mr-2 hover:bg-gray-200">
            <div class="flex items-center  hover:bg-gray-200  py-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm text-gray-700 px-1">{{user.name}}</span>
            </div>

            <div class="dropdown-menu pt-1 absolute hidden ">
                <ul class="text-sm text-gray-700 w-32 border  border-gray-100">
                    <li class=""><a
                            class=" bg-white hover:bg-gray-100 py-2 px-4 block whitespace-no-wrap"
                            href="#">个人设置</a></li>
                    <li class=""><a 
                                class=" bg-white hover:bg-gray-100 py-2 px-4 block whitespace-no-wrap"
                            href="#"
                            v-on:click="logout"
                            >退出</a></li>
                </ul>
            </div>
        </div>

        <button id="menuButton" class="px-2 hover:bg-gray-200 md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
        </button>
        
    </div>
    `,

})