
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
        logger.debug(sql)
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
        if (order.id) {
            sql = `update yw_ckgl_cc `
        } else {
            let id = makeOrderId()
            //插入主表
            sql = `insert into yw_ckgl_cc (ckdh, zdr, zdrq, xshth, gnkhmc, [state])
                  values ('${id}', '111', '${now}', '${id}', '${order.clientName}', '0')`
            let pool = await db_pool.getPool(db_config)
            logger.info(sql)
            await pool.query(sql)
            //插入商品
            let products = order.products
            for(var i = 0; i < products.length; i++) {
                let p = products[i]
                sql = `
                insert into yw_ckgl_cc_cmd 
                (spbm, hgbm, sphh, spzwmc, spywmc, spgg, sldw, hsje, hsdj, ckdh, cxh)
                values ('${p.spbm}', '${p.hgbm}', '${p.sphh}', '${p.name}', '${p.spywmc}', '${p.spgg}', '${p.sldw}', 0, '${p.price}', '${id}', '${i}')`
                logger.info(sql)
                await pool.query(sql)
            }
            //插入合同图片
            let images = order.images
            for(var i = 0; i < images.length; i++) {
                let image = images[i]
                sql = `insert into yw_ckgl_jc_images 
                       (id, rkdh, imageurl) values ('${uuidv4()}', '${id}', '${image.serverFileName}')`
                logger.info(sql)
                await pool.query(sql)
            }

            
        }
        return true;
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
    searchOrders: searchOrders
}