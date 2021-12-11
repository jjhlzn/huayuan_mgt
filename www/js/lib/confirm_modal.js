Vue.component('confirm-modal', {
    data: function () {
        return {
        }
    },
    methods: {
        cancel: function() {
            $('#confirm-modal').hide()
        }
    },
    template: `
            <div id="confirm-modal" class="min-w-screen h-screen animated fadeIn faster  fixed  left-0 top-0 flex justify-center 
                     items-center inset-0 z-50 outline-none focus:outline-none"  style="background: rgba(0,0,0,.3);" >
                <div class="w-full  max-w-lg p-5 relative mx-auto my-auto rounded-xl shadow-lg  bg-white ">
                  <!--content-->
                  <div class="">
                    <!--body-->
                    <div class="text-center p-5 flex-auto justify-center">
                                    <h2 class="text-xl font-bold py-4 ">确定删除吗?</h2>
                                    <p class="text-sm text-gray-500 px-8">删除的时候会同时删除掉关联的价格计划</p>    
                    </div>
                    <!--footer-->
                    <div class="p-3  mt-2 text-center space-x-4 md:block">
                        <button class="mb-2 md:mb-0 bg-white px-5 py-2 text-sm shadow-sm font-medium tracking-wider 
                            border text-gray-600 rounded hover:shadow-lg hover:bg-gray-100" 
                            v-on:click="cancel()">
                            取消
                        </button>
                        <button class="mb-2 md:mb-0 bg-red-500 border border-red-500 px-5 py-2 text-sm shadow-sm font-medium tracking-wider text-white rounded hover:shadow-lg hover:bg-red-600">确定</button>
                    </div>
                  </div>
                </div>
              </div>`
})
