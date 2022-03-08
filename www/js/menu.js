Vue.component('left-menu', {
    data: function () {
      return {
        expanded: false,
        menus: [
          {
            name: 'Buying order',
            level: 0,
            children: [],
            prefix: '/wxorders',
            link: '/wxorders/list.html'
          },
          {
            name: 'Inventory',
            level: 0,
            children: [],
            prefix: '/inboundorders/',
            link: '/inboundorders/list.html'
          },
          {
            name: 'Sales status',
            level: 0,
            children: [],
            prefix: '/products/',
            link: '/products/list.html'
          },
          {
            name: 'Goods Sold',
            level: 0,
            children: [],
            prefix: '/orders/',
            link: '/orders/list.html'
          },

          {
            name: '毛利表',
            level: 0,
            children: [
              {
                name: 'Goods Gross Profit',
                level: 0,
                children: [
                  
                ],
                prefix: '/maolibiao/list.html',
                link: '/maolibiao/list.html'
              },
              {
                name: '订单毛利表',
                level: 0,
                children: [
                  
                ],
                prefix: '/maolibiao/orderlist.html',
                link: '/maolibiao/orderlist.html'
              },
            ],
            prefix: '/maolibiao/',
            link: '#'
          },
         
        ]
      }
    },
    methods: {
      clickMenuItem: function(menuItem) {
        console.log(menuItem)
        console.log('clicked')
        //this.expanded = !this.expanded
        if (menuItem.children.length > 0) {
          
          menuItem.expanded = !menuItem.expanded
          console.log('set expanded to true')
          this.reloadMenus()
        } else {
          if (menuItem.link) {
            window.location.href = menuItem.link
          }
        }
      },

      reloadMenus: function() {
        var menus = []
        for(var i = 0; i < this.menus.length; i++) {
          menus.push(this.menus[i])
        }
        this.menus = menus
      }
      
    },
    mounted: function() {
      console.log('mounted')
      var path = window.location.pathname
      var search = window.location.search
      console.log(path)
      var menus = this.menus
      var found = false
      for(var i = 0; i < menus.length; i++) {
        var menuItem = menus[i]
        var children = menuItem.children
        var prefix = ''
        var query = ''
        if (children.length > 0) {
          for(var j = 0; j < children.length; j++) {
            prefix = children[j].prefix
            query = children[j].query
            //console.log(prefix)
            if (prefix && path.startsWith(prefix) ) {
              if (query) {
                if (search.indexOf(query) != -1) {
                  found = true
                  children[j].active = true
                  menuItem.expanded = true
                  break
                }
              }  else {
                found = true
                children[j].active = true
                menuItem.expanded = true
                break
              }
              
            }
          }
        } else {
          prefix = menuItem.prefix
          if (prefix && path.startsWith(prefix)) {
            found = true
            menuItem.active = true
          }
        }

        if (found) {
          console.log("found is true")
          break
        }
      }

      this.reloadMenus()
    },
    template: `



    <ul class="" style="z-index: 1000">
      <li class="flex flex-row-reverse pr-4 lg:hidden">
        <button id="closeMenuButton" class="py-1 px-2 hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 " fill="none" viewBox="0 0 24 24" stroke="#ffffff">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>

      <li v-for="menuItem in menus" >
          <ul v-if="menuItem.children.length > 0">
            <li class="bg-gray-600 text-base text-gray-400 hover:bg-gray-700 px-4 py-3 cursor-pointer" v-on:click="clickMenuItem(menuItem)" >
              <a href="#" class="flex items-center justify-between"  >
                  <span :class="menuItem.active ? 'text-blue-300 text-base ' : 'text-base'">
                    {{menuItem.name}}
                  </span>

                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" 
                        stroke-width="1" d="M19 9l-7 7-7-7" />
                  </svg>
              </a>  
            </li>

            <li v-if="menuItem.expanded">
                <ul v-for="childItem in menuItem.children">
                    <li class="bg-gray-800 text-base text-gray-400 pl-8 py-3 hover:bg-gray-900 cursor-pointer" v-on:click="clickMenuItem(childItem)">
                        <a href="#" class="flex items-center justify-between" >
                            <span :class="childItem.active ? 'text-blue-300 text-base ' : 'text-base'">
                              {{childItem.name}}
                            </span>
                         </a>  
                    </li>
                </ul>
            </li>
          </ul>

          <div v-if="menuItem.children.length == 0" class="bg-gray-600 text-base text-gray-400 hover:bg-gray-700 px-4 py-3 cursor-pointer"
          v-on:click="clickMenuItem(menuItem)">
             <a href="#" :class="menuItem.active ? 'text-blue-300 text-base ' : 'text-base'">  {{menuItem.name}} </a>
          </div>
  
      </li>
        
    </ul>
   
    
    
    `
})