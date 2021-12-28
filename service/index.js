
const db_pool = require('../lib/db_pool')
const db_config = require('../lib/db_config')
const { v4: uuidv4 } = require('uuid');
const logger = require('../lib/logger')('service/index.js')
const _ = require('underscore')
const moment = require('moment')

function makeSearchProductsSql(queryobj) {
    var whereClause = ` ( yw_ckgl_jc.rkdh = yw_ckgl_jc_cmd.rkdh ) and   
                ( yw_ckgl_jc.state in ('复核','入库') )  and
                yw_ckgl_jc_cmd.sjrksl > 
                isnull((select sum(b.ccsl) from yw_ckgl_cc_cmd b, yw_ckgl_cc c 
                    where b.ckdh = c.ckdh and 
                            yw_ckgl_jc_cmd.jcbh = b.jcbh and 
                            yw_ckgl_jc_cmd.jcxh = b.jcxh and
                            yw_ckgl_jc_cmd.rktzdh = b.rktzdh and 
                            yw_ckgl_jc_cmd.rktzdh_cxh = b.rktzdh_cxh),0)     `
    if (queryobj.keyword) {
        whereClause += `  and yw_ckgl_jc_cmd.spzwmc like '%${queryobj.keyword}%' `
    }
    const skipCount = queryobj.pageSize * (queryobj.pageNo - 1)

    const sqlstr = `select top ${queryobj.pageSize}  
            yw_ckgl_jc.rkdh + '_' + CONVERT(varchar(10), yw_ckgl_jc_cmd.rkxh)  as id,
            yw_ckgl_jc.rkdh,   --入库单号
              convert(varchar, yw_ckgl_jc.rkrq, 23) as time,   --入库日期
            yw_ckgl_jc.ywy,   --业务员
            yw_ckgl_jc.bm,   --部门
            yw_ckgl_jc.tt_no,   --抬头
            yw_ckgl_jc.cfck,    --存放仓库
            yw_ckgl_jc.dhbh,   ---提单号
            yw_ckgl_jc_cmd.spbm,   ---商品编码
            yw_ckgl_jc_cmd.hgbm,  --海关编码
            yw_ckgl_jc_cmd.sphh,  --商品货号
            yw_ckgl_jc_cmd.sphh_kh,    --商品客户货号 
            yw_ckgl_jc_cmd.spzwmc as name,   --商品中文名称
            yw_ckgl_jc_cmd.spywmc ,   --商品英文名称
            yw_ckgl_jc_cmd.spgg as spec,   --商品规格
            yw_ckgl_jc_cmd.sjrksl as quantity, --入库数量
            yw_ckgl_jc_cmd.sldw,    --单位
            yw_ckgl_jc_cmd.hsje,   --金额

            yw_ckgl_jc_cmd.hsdj as price,   ---单价
            yw_ckgl_jc_cmd.rkxh,  --入库序号
            yw_ckgl_jc_cmd.mxdbh, --明细单编号
            yw_ckgl_jc_cmd.mxd_spid, --明细单ID
            yw_ckgl_jc_cmd.wxhth, --外销合同号
            yw_ckgl_jc_cmd.wxht_spid, --外销合同ID
            c_ycksl = (select sum(b.ccsl) from yw_ckgl_cc_cmd b, yw_ckgl_cc c 
                            where b.ckdh = c.ckdh and 
                                    yw_ckgl_jc_cmd.rkdh = b.yrkdh and 
                                    yw_ckgl_jc_cmd.rkxh = b.yrkxh),
            yw_ckgl_jc_cmd.rktzdh,
            yw_ckgl_jc_cmd.rktzdh_cxh
            FROM yw_ckgl_jc,   
                yw_ckgl_jc_cmd
            where ${whereClause} 
            and yw_ckgl_jc.rkdh + '_' + CONVERT(varchar(10), yw_ckgl_jc_cmd.rkxh)
                 not in (select top ${skipCount} id from (select  yw_ckgl_jc.rkdh + '_' + CONVERT(varchar(10), yw_ckgl_jc_cmd.rkxh)  as id,
                 yw_ckgl_jc.rkrq from
			          yw_ckgl_jc, yw_ckgl_jc_cmd where ${whereClause} ) as middleTable order by rkrq )
            order by yw_ckgl_jc.rkrq`
    //logger.info(sqlstr)
    const statSqlstr = `select count(1) as totalCount from yw_ckgl_jc, yw_ckgl_jc_cmd where ${whereClause}
                       `
    //console.log(sqlstr)
    //console.log(statSqlstr)
    return [sqlstr, statSqlstr]

}

async function searchProducts(params) {
    console.log(params)
    try {
        let sqlstrs = makeSearchProductsSql(params)
        let pool = await db_pool.getPool(db_config)
        let products = (await pool.query(sqlstrs[0])).recordset
        let totalCount = (await pool.query(sqlstrs[1])).recordset[0]['totalCount']
        products.forEach(product => {
            if (!product.hsje) {
                product.hsje = 0
            }
             product.hsje = product.hsje.toFixed(0)
        })
        return {
            products: products,
            totalCount: totalCount
        }
    } catch (error) {
        logger.error(error)
        return {message: '出错了', products: [], totalCount: 0}
    } 
}

function makeSearchOrdersSql(queryobj) {
    var whereClause = ` 1 = 1 `
    if (queryobj.keyword) {
        whereClause += `  and gnkhmc+ckdh like '%${queryobj.keyword}%' `
    }
    const skipCount = queryobj.pageSize * (queryobj.pageNo - 1)

    const sqlstr = `select top ${queryobj.pageSize}  
                yw_ckgl_cc.ckdh,   --销售合同号
                yw_ckgl_cc.zdr,   
                yw_ckgl_cc.zdrq,   
                yw_ckgl_cc.ywxz,   ---生成的时候默认（国外出库）
                yw_ckgl_cc.ckxz,   ---生成的时候默认（国外出库）
                yw_ckgl_cc.cklx,   ---生成的时候默认（国外出库）
                yw_ckgl_cc.cklx2,   ---生成的时候默认（国外出库）
                yw_ckgl_cc.xshth,   --订单号
                yw_ckgl_cc.gnkhbm,   --客户编码（空）
                yw_ckgl_cc.gnkhmc,   --客户名称
                yw_ckgl_cc.gnkhxx,   --客户信息
                yw_ckgl_cc.ywy,   --业务员
                yw_ckgl_cc.bm,   --部门
                yw_ckgl_cc.cfck,   --存放仓库
                yw_ckgl_cc.ckje,   --销售金额
                yw_ckgl_cc.state,   --状态
                yw_ckgl_cc.ckrq,    
                seller, 
                convert(varchar, sellDate, 23) as sellDate,
                yw_ckgl_cc.bz,   --备注
                yw_ckgl_cc.jw_flag   --Y
            FROM yw_ckgl_cc
            where ${whereClause} 
            and ckdh not in (select top ${skipCount} ckdh from yw_ckgl_cc where ${whereClause} order by zdrq )
            order by zdrq`
    //logger.info(sqlstr)
    const statSqlstr = `select count(1) as totalCount from yw_ckgl_cc where ${whereClause}
                       `
    //console.log(sqlstr)
    //console.log(statSqlstr)
    return [sqlstr, statSqlstr]
}

async function searchOrders(params) {
    console.log(params)
    try {
        let sqlstrs = makeSearchOrdersSql(params)
        let pool = await db_pool.getPool(db_config)
        let orders = (await pool.query(sqlstrs[0])).recordset
        let totalCount = (await pool.query(sqlstrs[1])).recordset[0]['totalCount']
        
        return {
            orders: orders,
            totalCount: totalCount
        }
    } catch (error) {
        logger.error(error)
        return {message: '出错了', orders: [], totalCount: 0}
    } 
}

async function loadProducts(ids) {
    if (!ids || (ids && ids.length == 0)) {
        return []
    }

    let idsCaluse = ''
    ids.forEach(function(id) {
        idsCaluse += `'${id}',`
    })
    idsCaluse = idsCaluse.substring(0, idsCaluse.length-1)
    idsCaluse = `(${idsCaluse})`

    try {
        let whereClause = ` ( yw_ckgl_jc.rkdh = yw_ckgl_jc_cmd.rkdh ) and   
                ( yw_ckgl_jc.state in ('复核','入库') )  and
                yw_ckgl_jc_cmd.sjrksl > 
                isnull((select sum(b.ccsl) from yw_ckgl_cc_cmd b, yw_ckgl_cc c 
                    where b.ckdh = c.ckdh and 
                            yw_ckgl_jc_cmd.jcbh = b.jcbh and 
                            yw_ckgl_jc_cmd.jcxh = b.jcxh and
                            yw_ckgl_jc_cmd.rktzdh = b.rktzdh and 
                            yw_ckgl_jc_cmd.rktzdh_cxh = b.rktzdh_cxh),0)
                and  yw_ckgl_jc.rkdh + '_' + CONVERT(varchar(10), yw_ckgl_jc_cmd.rkxh) in ${idsCaluse}    `
        let sql = `select yw_ckgl_jc.rkdh + '_' + CONVERT(varchar(10), yw_ckgl_jc_cmd.rkxh)  as id,
         yw_ckgl_jc.rkdh + '_' + CONVERT(varchar(10), yw_ckgl_jc_cmd.rkxh)  as productId,
        yw_ckgl_jc.rkdh,   --入库单号
          convert(varchar, yw_ckgl_jc.rkrq, 23) as time,   --入库日期
        yw_ckgl_jc.ywy,   --业务员
        yw_ckgl_jc.bm,   --部门
        yw_ckgl_jc.tt_no,   --抬头
        yw_ckgl_jc.cfck,    --存放仓库
        yw_ckgl_jc.dhbh,   ---提单号
        yw_ckgl_jc_cmd.spbm,   ---商品编码
        yw_ckgl_jc_cmd.hgbm,  --海关编码
        yw_ckgl_jc_cmd.sphh,  --商品货号
        yw_ckgl_jc_cmd.sphh_kh,    --商品客户货号 
        yw_ckgl_jc_cmd.spzwmc as name,   --商品中文名称
        yw_ckgl_jc_cmd.spywmc ,   --商品英文名称
        yw_ckgl_jc_cmd.spgg as spec,   --商品规格
        yw_ckgl_jc_cmd.sjrksl as quantity, --入库数量
        yw_ckgl_jc_cmd.sldw,    --单位
        yw_ckgl_jc_cmd.hsje,   --金额

        yw_ckgl_jc_cmd.hsdj as price,   ---单价
        yw_ckgl_jc_cmd.rkxh,  --入库序号
        yw_ckgl_jc_cmd.mxdbh, --明细单编号
        yw_ckgl_jc_cmd.mxd_spid, --明细单ID
        yw_ckgl_jc_cmd.wxhth, --外销合同号
        yw_ckgl_jc_cmd.wxht_spid, --外销合同ID
        c_ycksl = (select sum(b.ccsl) from yw_ckgl_cc_cmd b, yw_ckgl_cc c 
                        where b.ckdh = c.ckdh and 
                                yw_ckgl_jc_cmd.rkdh = b.yrkdh and 
                                yw_ckgl_jc_cmd.rkxh = b.yrkxh),
        yw_ckgl_jc_cmd.rktzdh,
        yw_ckgl_jc_cmd.rktzdh_cxh
        FROM yw_ckgl_jc,   
            yw_ckgl_jc_cmd
        where ${whereClause}  `
        //logger.debug(sql)
        let pool = await db_pool.getPool(db_config)
        let products = (await pool.query(sql)).recordset
        products.forEach(product => {
            product.buyQuantity = 0
        })
        return products
    }
    catch(error) {
        logger.error(error)
        return []
    }
}


async function addOrUpdateOrder(order) {
    let sql = ``
    let now = moment().format('YYYY-MM-DD HH:mm:ss')
    try {
        let pool = await db_pool.getPool(db_config)
        if (order.id) {
            sql = `update yw_ckgl_cc set  gnkhmc = '${order.clientName}', seller = '${order.seller}', sellDate = '${order.sellDate}' where ckdh = '${order.id}'`
            await pool.query(sql)

            //更新商品
            sql =  `delete from yw_ckgl_cc_cmd where ckdh = '${order.id}' `
            await pool.query(sql)

            //更新图片
            sql = `delete from yw_ckgl_cc_images where ckdh = '${order.id}'`
            await pool.query(sql)

        } else {
            let id = makeOrderId()
            order.id = id
            //插入主表

            sql = `insert into yw_ckgl_cc (ckdh, zdr, zdrq, xshth, gnkhmc, seller, sellDate, [state])
                  values ('${id}', '111', '${now}', '${id}', '${order.clientName}', '${order.seller}', '${order.sellDate.substring(0, 10)}', '0')`
            
            logger.info(sql)
            await pool.query(sql)
            
        }

        //插入商品
        let products = order.products
        for(var i = 0; i < products.length; i++) {
            let p = products[i]
            sql = `
            insert into yw_ckgl_cc_cmd 
            (spbm, hgbm, sphh, spzwmc, spywmc, spgg, sldw, hsje, hsdj, ckdh, ckxh, cxh, productId)
            values ('${p.spbm}', '${p.hgbm}', '${p.sphh}', '${p.name}', '${p.spywmc}', '${p.spgg}', '${p.sldw}', 0, '${p.price}', '${order.id}', 
                '${p.buyQuantity}', '${i}', '${p.productId}')`
            logger.debug("product.id:" + p.productId)
            logger.info(sql)
            await pool.query(sql)
        }
        //插入合同图片
        let images = order.images
        for(var i = 0; i < images.length; i++) {
            let image = images[i]
            sql = `insert into yw_ckgl_cc_images 
                   (id, ckdh, imageurl) values ('${uuidv4()}', '${order.id}', '${image}')`
            logger.info(sql)
            await pool.query(sql)
        }
        return order.id
    } catch(error) {
        logger.error(error)
        return ''
    }
    
}

async function getOrderById(id) {
    try {
        let sql = `SELECT yw_ckgl_cc.ckdh,   --销售合同号
                yw_ckgl_cc.zdr,   
                yw_ckgl_cc.zdrq,   
                yw_ckgl_cc.ywxz,   ---生成的时候默认（国外出库）
                yw_ckgl_cc.ckxz,   ---生成的时候默认（国外出库）
                yw_ckgl_cc.cklx,   ---生成的时候默认（国外出库）
                yw_ckgl_cc.cklx2,   ---生成的时候默认（国外出库）
                yw_ckgl_cc.xshth,   --订单号
                yw_ckgl_cc.gnkhbm,   --客户编码（空）
                yw_ckgl_cc.gnkhmc as clientName,   --客户名称
                yw_ckgl_cc.gnkhxx,   --客户信息
                yw_ckgl_cc.ywy,   --业务员
                yw_ckgl_cc.bm,   --部门
                yw_ckgl_cc.cfck,   --存放仓库
                yw_ckgl_cc.ckje,   --销售金额
                yw_ckgl_cc.state,   --状态
                yw_ckgl_cc.ckrq,    
                seller,
                convert(varchar, sellDate, 23) as sellDate,
                yw_ckgl_cc.bz,   --备注
                yw_ckgl_cc.jw_flag   --Y
        FROM yw_ckgl_cc
        WHERE ckdh = '${id}' `
        logger.info(sql)
        let pool = await db_pool.getPool(db_config)
        let orders = (await pool.query(sql)).recordset
        if (orders.length == 0) {
            return null
        }
        let order = orders[0]

        //加载商品
        sql = `select spbm, hgbm, sphh, spzwmc as name, spywmc, spgg, sldw, hsje, hsdj as price, ckxh as buyQuantity,
                    ckdh, cxh, productId from yw_ckgl_cc_cmd where ckdh = '${id}' order by cxh`
       // logger.info(sql)
        let products = (await pool.query(sql)).recordset
        order.products = products
        order.products.forEach(product => product.id = product.ckdh + '_' + product.cxh)

        //加载图片
        sql = `select imageUrl from yw_ckgl_cc_images where ckdh = '${id}' order by addtime`
       // logger.info(sql)
        let images = (await pool.query(sql)).recordset
        order.images = images

        return order
    } catch(error) {
        logger.error(error)
        return null
    }
}

async function deleteOrder(id) {
    try {
        let sql = `delete from yw_ckgl_cc where ckdh = '${id}'`
        let pool = await db_pool.getPool(db_config)
        await pool.query(sql)
        return true
    } catch(error) {
        logger.error(error)
        return false
    }
}

function makeOrderId() {
    let id = moment().format('YYMMDDHHMMSS') + Math.floor(Math.random() * 10)
    return id
}


module.exports = {
    searchProducts: searchProducts,
    loadProducts: loadProducts,
    addOrUpdateOrder: addOrUpdateOrder,
    searchOrders: searchOrders,
    getOrderById: getOrderById,
    deleteOrder: deleteOrder,
}