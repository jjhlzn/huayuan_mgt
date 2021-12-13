
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
        $('#closeMenuButton').click(function() {
            $('#menu').toggleClass('-translate-x-full')
        })
    },
    template: `
    <div id="header" style="background-color: #001529;" class="flex flex-row-reverse justify-between ">
        
        <div class="dropdown inline-block relative mr-2 hover:bg-gray-700">
            <div class="flex items-center  hover:bg-gray-700  py-2 ">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="#ffffff">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
                </svg>
                <span class="text-sm text-white px-1">{{user.name}}</span>
            </div>

            <div class="dropdown-menu pt-1 absolute hidden " style="z-index:1000">
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

        <div class="flex text-base font-medium text-white  py-2">
          <!-- log -->
            <div class=" px-3 pt-0.4">
                <svg viewBox="0 0 200 200" class="w-6 h-6 " version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <!-- Generator: Sketch 47.1 (45422) - http://www.bohemiancoding.com/sketch -->
                    <title>Group 28 Copy 5</title>
                    <desc>Created with Sketch.</desc>
                    <defs>
                        <linearGradient x1="62.1023273%" y1="0%" x2="108.19718%" y2="37.8635764%" id="linearGradient-1">
                            <stop stop-color="#4285EB" offset="0%"></stop>
                            <stop stop-color="#2EC7FF" offset="100%"></stop>
                        </linearGradient>
                        <linearGradient x1="69.644116%" y1="0%" x2="54.0428975%" y2="108.456714%" id="linearGradient-2">
                            <stop stop-color="#29CDFF" offset="0%"></stop>
                            <stop stop-color="#148EFF" offset="37.8600687%"></stop>
                            <stop stop-color="#0A60FF" offset="100%"></stop>
                        </linearGradient>
                        <linearGradient x1="69.6908165%" y1="-12.9743587%" x2="16.7228981%" y2="117.391248%" id="linearGradient-3">
                            <stop stop-color="#FA816E" offset="0%"></stop>
                            <stop stop-color="#F74A5C" offset="41.472606%"></stop>
                            <stop stop-color="#F51D2C" offset="100%"></stop>
                        </linearGradient>
                        <linearGradient x1="68.1279872%" y1="-35.6905737%" x2="30.4400914%" y2="114.942679%" id="linearGradient-4">
                            <stop stop-color="#FA8E7D" offset="0%"></stop>
                            <stop stop-color="#F74A5C" offset="51.2635191%"></stop>
                            <stop stop-color="#F51D2C" offset="100%"></stop>
                        </linearGradient>
                    </defs>
                    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g id="logo" transform="translate(-20.000000, -20.000000)">
                            <g id="Group-28-Copy-5" transform="translate(20.000000, 20.000000)">
                                <g id="Group-27-Copy-3">
                                    <g id="Group-25" fill-rule="nonzero">
                                        <g id="2">
                                            <path d="M91.5880863,4.17652823 L4.17996544,91.5127728 C-0.519240605,96.2081146 -0.519240605,103.791885 4.17996544,108.487227 L91.5880863,195.823472 C96.2872923,200.518814 103.877304,200.518814 108.57651,195.823472 L145.225487,159.204632 C149.433969,154.999611 149.433969,148.181924 145.225487,143.976903 C141.017005,139.771881 134.193707,139.771881 129.985225,143.976903 L102.20193,171.737352 C101.032305,172.906015 99.2571609,172.906015 98.0875359,171.737352 L28.285908,101.993122 C27.1162831,100.824459 27.1162831,99.050775 28.285908,97.8821118 L98.0875359,28.1378823 C99.2571609,26.9692191 101.032305,26.9692191 102.20193,28.1378823 L129.985225,55.8983314 C134.193707,60.1033528 141.017005,60.1033528 145.225487,55.8983314 C149.433969,51.69331 149.433969,44.8756232 145.225487,40.6706018 L108.58055,4.05574592 C103.862049,-0.537986846 96.2692618,-0.500797906 91.5880863,4.17652823 Z" id="Shape" fill="url(#linearGradient-1)"></path>
                                            <path d="M91.5880863,4.17652823 L4.17996544,91.5127728 C-0.519240605,96.2081146 -0.519240605,103.791885 4.17996544,108.487227 L91.5880863,195.823472 C96.2872923,200.518814 103.877304,200.518814 108.57651,195.823472 L145.225487,159.204632 C149.433969,154.999611 149.433969,148.181924 145.225487,143.976903 C141.017005,139.771881 134.193707,139.771881 129.985225,143.976903 L102.20193,171.737352 C101.032305,172.906015 99.2571609,172.906015 98.0875359,171.737352 L28.285908,101.993122 C27.1162831,100.824459 27.1162831,99.050775 28.285908,97.8821118 L98.0875359,28.1378823 C100.999864,25.6271836 105.751642,20.541824 112.729652,19.3524487 C117.915585,18.4685261 123.585219,20.4140239 129.738554,25.1889424 C125.624663,21.0784292 118.571995,14.0340304 108.58055,4.05574592 C103.862049,-0.537986846 96.2692618,-0.500797906 91.5880863,4.17652823 Z" id="Shape" fill="url(#linearGradient-2)"></path>
                                        </g>
                                        <path d="M153.685633,135.854579 C157.894115,140.0596 164.717412,140.0596 168.925894,135.854579 L195.959977,108.842726 C200.659183,104.147384 200.659183,96.5636133 195.960527,91.8688194 L168.690777,64.7181159 C164.472332,60.5180858 157.646868,60.5241425 153.435895,64.7316526 C149.227413,68.936674 149.227413,75.7543607 153.435895,79.9593821 L171.854035,98.3623765 C173.02366,99.5310396 173.02366,101.304724 171.854035,102.473387 L153.685633,120.626849 C149.47715,124.83187 149.47715,131.649557 153.685633,135.854579 Z" id="Shape" fill="url(#linearGradient-3)"></path>
                                    </g>
                                    <ellipse id="Combined-Shape" fill="url(#linearGradient-4)" cx="100.519339" cy="100.436681" rx="23.6001926" ry="23.580786"></ellipse>
                                </g>
                            </g>
                        </g>
                    </g>
                </svg>
            </div>

            <div class="hidden md:block">
                Design System
            </div>

            <button id="menuButton" class=" hover:bg-gray-700 md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                </svg>
            </button>

        </div>

       
        
    </div>
    `,

})