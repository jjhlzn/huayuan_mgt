const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const logger = require('./lib/logger')('index.js')
const fs = require('fs')
const path = require('path')

const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'www/uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
})
const upload = multer({ storage: storage })
const {handleFloatProps} = require('./handle_response')


var cookieParser = require('cookie-parser')
const service = require('./service')

const moment = require('moment')
const auth = require('./middleware/auth')
//app.use(morgan('dev'));

app.set('view engine', 'pug');
app.set('views', [__dirname + '/www', __dirname + '/www/views']);

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser());

app.get('/', (req, res) => {
    //res.send('Hello world')
    res.sendFile(__dirname + '/www/login.html')
})

app.get('/test.html', (req, res) => {
    //res.send('Hello world')
    res.sendFile(__dirname + '/www/test.html')
})
app.get('/inboundorders/list.html', (req, res) => {
    res.sendFile(__dirname + '/www/inboundorders.html')
})
app.get('/inboundorders/order.html', (req, res) => {
    res.sendFile(__dirname + '/www/inbound_order.html')
})
app.get('/products/list2.html', (req, res) => {
    res.sendFile(__dirname + '/www/products2.html')
})
app.get('/products/list.html', (req, res) => {
    res.sendFile(__dirname + '/www/products.html')
})
app.get('/orders/select_products.html', (req, res) => {
    res.sendFile(__dirname + '/www/select_products.html')
})
app.get('/orders/neworder.html', (req, res) => {
    res.sendFile(__dirname + '/www/new_order.html')
})
app.get('/orders/list.html', (req, res) => {
    res.sendFile(__dirname + '/www/orders.html')
})
app.get('/wxorders/list.html', (req, res) => {
    res.sendFile(__dirname + '/www/wxorders.html')
})
app.get('/wxorders/order.html', (req, res) => {
    res.sendFile(__dirname + '/www/wxorder.html')
})
app.get('/maolibiao/list.html', (req, res) => {
    res.sendFile(__dirname + '/www/maolibiao.html')
})
app.get('/maolibiao/orderlist.html', (req, res) => {
    res.sendFile(__dirname + '/www/ordermaolibiao.html')
})
app.get('/settings.html', (req, res) => {
    res.sendFile(__dirname + '/www/settings.html')
})


app.post('/login', async (req, res) => {
    const user = {userId: req.body.userId, password: req.body.password}

    //let foundUser = users.find(item => item.userId == user.userId)
    let foundUser = await service.login(req.body.userId, req.body.password)
    //console.log(foundUser)
    if (foundUser) {
        var privateKey = fs.readFileSync('private.key').toString()
        let payload = { userId: user.userId }
        var token = jwt.sign(payload, privateKey, {expiresIn: 60 * 60 * 24 * 7 * 365});
        return res.send({status: 0, errorMessage: '', token: token, userInfo: {name: foundUser.name, userId: foundUser.userId}})
    } else {
        logger.debug(user.userId + " can't found")
        res.send({status: -1, errorMessage: '用户名或密码错误'})
    }
})

app.post('/changepassword', auth, async(req, res) => {
    const {userId, password, newPassword} = req.body
    let message = await service.changePassword(userId, password, newPassword)
    
    res.send(JSON.stringify({
        status: message ? '-1' : 0,
        message: message
    }))
    
})

app.post('/checktoken', auth, (req, res) => {
    res.send({status: 0})
})

app.all('/searchproducts', auth, async (req, res) => {
    let result = await service.searchProducts(req.body.params)
    handleFloatProps(result)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        products: result.products,
        totalCount: result.totalCount
    }))
})

app.all('/searchproducts2', auth, async (req, res) => {
    let result = await service.searchProducts2(req.body.params)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        products: result.products,
        totalCount: result.totalCount
    }))
})

app.all('/getproducts', auth, async (req, res) => {
    let ids = req.body.ids || req.body.productIds
    let products = await service.loadProducts(ids)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        products: products
    }))
})

app.post('/upload', upload.single('photo'), async (req, res) => {
    logger.debug('get upload request')
    if(req.file) {
        res.send(JSON.stringify(req.file))
        logger.info(JSON.stringify(req.file))
    } else {
        throw 'error';
    }
});


app.post('/updateorder', auth, async (req, res) => {
    let order = req.body
     console.log(JSON.stringify(order))
    let result = await service.addOrUpdateOrder(order)
    res.send(JSON.stringify({
        status: result ? 0 : -1, 
        message: '',
        id: result
    }))
})

app.all('/searchorders', auth, async (req, res) => {
    let result = await service.searchOrders(req.body.params)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        orders: result.orders,
        totalCount: result.totalCount
    })) 
})

app.all('/searchinboundorders', auth, async (req, res) => {
    let result = await service.searchInboundOrders(req.body.params)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        orders: result.orders,
        totalCount: result.totalCount
    }))
})

app.all('/searchmaolibiaos', auth, async (req, res) => {
    let result = await service.searchMaolibiaos(req.body.params)
    handleFloatProps(result)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        orders: result.orders,
        totalCount: result.totalCount
    }))
})


app.all('/searchordermaolibiaos', auth, async (req, res) => {
    let result = await service.searchOrderMaolibiaos(req.body.params)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        orders: result.orders,
        totalCount: result.totalCount
    }))
})

app.post('/getinboundorder', auth, async (req, res) => {
    let id = req.body.id
    let order = await service.getInboundOrderById(id)
    res.send(JSON.stringify({ 
        status: order != null ? 0 : -1,
        message: '',
        order: order
    }))
})

app.post('/updatepayment', auth, async (req, res) => {
    let payment = req.body
    let id = await service.addOrUpdatePayment(payment)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        id: id
    }))
})

app.post('/deletepayment', auth, async (req, res) => {
    let id = req.body.id
    await service.deletePayment(id)
    res.send(JSON.stringify({
        status: 0,
        message: ''
    }))
})

app.all('/getorder', auth, async (req, res) => {
    let id = req.body.id
    let order = await service.getOrderById(id)
    if (order){
        order.products.forEach(product => product.hasInOrder = true)
    }
    res.send(JSON.stringify({ 
        status: order != null ? 0 : -1,
        message: '',
        order: order
    }))
})

app.post('/deleteorder', auth, async (req, res) => {
    let id = req.body.id
    let result = await service.deleteOrder(id)
    res.send(JSON.stringify({
        status: result ? 0 : -1,
        message: ''
    }))
})

app.post('/settleorder', auth, async (req, res) => {
    let id = req.body.id
    let result = await service.settleOrder(id)
    res.send(JSON.stringify({
        status: result ? 0 : -1,
        message: ''
    })) 
})




//该请求获取订单和商品，如果出库单的商品和所请求的商品有重合，则设置商品的数量
app.all('/getorderandproducts', auth, async (req, res) => {
    let productIds = req.body.productIds
    logger.info(JSON.stringify(productIds))
    let products = await service.loadProducts(productIds)
    console.log("products.length: ", products.length)
    //console.log(products)
    let id = req.body.id
    let order = await service.getOrderById(id)
    let newList = []
    //console.log(order)
    if (order != null){
        let products2 = order.products
        products2.forEach((product) => product.hasInOrder = true)

        for(var i = 0; i < products.length; i++) {
            if (isInList(products[i].productId, products2)) {
                newList.push(getProduct(products[i].productId, products2))
            }
        }

        for(var i = 0; i < products.length; i++) {
            if (!isInList(products[i].productId, products2)) {
                newList.push(products[i])
            }
        }
        order.products = newList
    }
    res.send(JSON.stringify({ 
        status: order != null ? 0 : -1,
        message: '',
        order: order
    }))
})

app.all('/searchwxorders', auth, async (req, res) => {
    let result = await service.searchWaixiaoOrders(req.body.params)
    handleFloatProps(result)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        orders: result.orders,
        totalCount: result.totalCount
    }))
})

app.all('/getwxorder', auth, async (req, res) => {
    logger.info(JSON.stringify(req.body))
    let order = await service.getWxOrderById(req.body.id)
    logger.debug(JSON.stringify(order))
    res.send(JSON.stringify({
        status: order != null ? 0 : -1,
        message: '',
        order: order
    }))
} )

app.post('/checkcanaddpayment', auth,  async( req, res) => {
    logger.debug(`userId = ${req.params.userId}`)


    let canAddPayment = await service.checkCanAddPayment(req.params.userId, req.body.roleName)
    res.send(JSON.stringify({
        status: 0,
        canAddPayment: canAddPayment
    }))
})

function isInList(id, products) {
    for(var i = 0; i < products.length; i++) { 
        if (products[i].productId == id) {
            return true
        }
    }
    return false
}

function getProduct(id, products) {
    for(var i = 0; i < products.length; i++) { 
        if (products[i].productId == id) {
            return products[i]
        }
    }
}


const port = 7897

app.use(express.static('www'))
app.listen(port, () => logger.debug(`management app listening at ${port}`))

