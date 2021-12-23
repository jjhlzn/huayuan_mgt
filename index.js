const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const logger = require('./lib/logger')('index.js')
const fs = require('fs')
const path = require('path')

const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
})
const upload = multer({ storage: storage })


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
app.get('/settlements/list.html', (req, res) => {
    res.sendFile(__dirname + '/www/settlements.html')
})


app.get('/index.html', function(req, res) {
    res.sendFile(__dirname + '/www/products.html')
});

let users = [{userId: 'admin', password: '123456', name: '管理员'}]

app.post('/login', (req, res) => {
    const user = {userId: req.body.userId, password: req.body.password}

    let foundUser = users.find(item => item.userId == user.userId)
    if (foundUser) {
        if (foundUser.password != user.password) {
            logger.debug(user.userId + " password wrong")
            return res.send({status: -1, errorMessage: '用户名或密码错误'})
        }
        var privateKey = fs.readFileSync('private.key').toString()
        let payload = { userId: user.userId }
        var token = jwt.sign(payload, privateKey, {expiresIn: 60 * 60 * 24 * 7});
        return res.send({status: 0, errorMessage: '', token: token, userInfo: {name: foundUser.name}})
    } else {
        logger.debug(user.userId + " can't found")
        res.send({status: -1, errorMessage: '用户名或密码错误'})
    }
})

app.post('/checktoken', auth, (req, res) => {
    res.send({status: 0})
})

app.all('/searchproducts', auth, async (req, res) => {
    let result = await service.searchProducts(req.body.params)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        products: result.products,
        totalCount: result.totalCount
    }))
})

app.all('/getproducts', auth, async (req, res) => {
    let ids = req.body.ids
    let products = await service.loadProducts(ids)
    res.send(JSON.stringify({
        status: 0,
        message: '',
        products: products
    }))
})

app.post('/upload', upload.single('photo'), async (req, res) => {
    if(req.file) {
        res.send(JSON.stringify(req.file))
        logger.info(JSON.stringify(req.file))
    } else {
        throw 'error';
    }
});

app.post('/updateorder', auth, async (req, res) => {
    let order = req.body
    let result = await service.addOrUpdateOrder(order)
    res.send(JSON.stringify({
        status: result ? 0 : -1, 
        message: ''
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



const port = 7897

app.use(express.static('www'))
app.listen(port, () => logger.debug(`management app listening at ${port}`))

