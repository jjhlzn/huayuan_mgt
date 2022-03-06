
Vue.component('user-header', {
    data: function() {
        return {
            user: {},
            menuShow: false,
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

        let that = this
        $('#menuButton').click(function() {
            console.log('menu click')
            $('#menu').toggleClass('-translate-x-full') 
            $('#contentDiv').toggleClass('relative')
            //$('.orderImage').toggleClass('relative')
            //$('.orderImage').toggle()

        })
        $('#closeMenuButton').click(function() {
            $('#menu').toggleClass('-translate-x-full')
            setTimeout(function() {
                $('#contentDiv').toggleClass('relative')
               // $('.orderImage').toggleClass('relative')
               // $('.orderImage').toggle()
            }, 500)
            
        })
        $('#cartButton').click(function() {
            window.location.href = "/orders/neworder.html"
        })
    },
    template: `
    <div id="header" style="background-color: #001529;" class="flex justify-between w-full h-12">

        <div class="flex text-base font-medium text-white">

            <div class="px-14 py-3 hidden lg:block">
                管理系统
            </div>

            <button id="menuButton" class=" px-4 hover:bg-gray-700 hidden ">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                </svg>
            </button>

        </div>
        
        <div class="flex">
            <button id="cartButton" class="hover:bg-gray-700 py-2 px-2 relative inline-block hidden">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="#ffffff">
                    <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>

                <span class=" absolute top-3 right-2 inline-flex items-center justify-center px-1 py-1 text-xs leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">10</span>
            </button>


            <div class="flex items-center">
                <div class="dropdown inline-block px-5   hover:bg-gray-700 h-full">
                    <div class="flex  hover:bg-gray-700 h-full items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="#ffffff">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-sm text-white px-2">{{user.name}}</span>
                    </div>

                    <div class="dropdown-menu pt-1 absolute hidden" style="z-index:1000">
                        <ul class="text-sm text-gray-700 w-22 border border-gray-100">
                            <li class=""><a
                                class=" bg-white hover:bg-gray-100 py-2 px-4 block whitespace-no-wrap"
                                href="/settings.html">个人设置</a>
                            </li>
                            <li class=""><a 
                                        class=" bg-white hover:bg-gray-100 py-2 px-4 block whitespace-no-wrap"
                                    href="#"
                                    v-on:click="logout"
                                    >退出</a></li>
                        </ul>
                    </div>
                </div>

            </div>

            

        </div>

        

       
        
    </div>
    `,

})