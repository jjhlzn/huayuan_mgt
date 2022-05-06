
const db_pool = require('../lib/db_pool')
const db_config = require('../lib/db_config')
const { v4: uuidv4 } = require('uuid');
const logger = require('../lib/logger')('service/index.js')
const _ = require('underscore')
const moment = require('moment')
const md5 = require('md5')

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
    if (queryobj.soldStatus) {
        if (queryobj.soldStatus === '已售') {
            whereClause += ` and yw_ckgl_jc_cmd.sjrksl <= 0 `
        } else if (queryobj.soldStatus === '未售') {
            whereClause += ` and yw_ckgl_jc_cmd.sjrksl > 0  `
        }
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
            yw_ckgl_jc_cmd.sjrksl,
            yw_ckgl_jc_cmd.ycksl,

            IsNULL( (select sum(sjccsl) from yw_ckgl_cc_cmd
            where yrkdh = yw_ckgl_jc_cmd.rkdh and yrkxh = yw_ckgl_jc_cmd.rkxh), 0) as soldQuantity,  --卖出数量

            -- wxdj, wxzj, 
            (select sum(wxzj) from yw_ckgl_cc_cmd
            where yrkdh = yw_ckgl_jc_cmd.rkdh and yrkxh = yw_ckgl_jc_cmd.rkxh) as soldAmount,  --卖出总价
        

            yw_ckgl_jc_cmd.hsdj as price,   ---单价
            yw_ckgl_jc_cmd.hsdj,
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

    console.log(sqlstr)
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
            if (!product.price) {
                product.price = 0
            }
            product.hsje = parseFloat(product.hsje)
            if (!product.soldQuantity) {
                product.soldQuantity = 0
            }
            // product.hsje = product.hsje.toFixed(0)
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

function makeSearchProductsSql2(queryobj) {
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
    if (queryobj.soldStatus) {
        if (queryobj.soldStatus === '已售') {
            whereClause += ` and yw_ckgl_jc_cmd.sjrksl <= 0 `
        } else if (queryobj.soldStatus === '未售') {
            whereClause += ` and yw_ckgl_jc_cmd.sjrksl > 0  `
        }
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

            IsNULL( (select sum(sjccsl) from yw_ckgl_cc_cmd
            where yrkdh = yw_ckgl_jc_cmd.rkdh and yrkxh = yw_ckgl_jc_cmd.rkxh), 0) as soldQuantity,  --卖出数量

            -- wxdj, wxzj, 
            (select sum(wxzj) from yw_ckgl_cc_cmd
            where yrkdh = yw_ckgl_jc_cmd.rkdh and yrkxh = yw_ckgl_jc_cmd.rkxh) as soldAmount,  --卖出总价

            yw_ckgl_jc_cmd.sldw,    --单位
            yw_ckgl_jc_cmd.hsje,   --金额
            yw_ckgl_jc_cmd.sjrksl,
            yw_ckgl_jc_cmd.ycksl,

            yw_ckgl_jc_cmd.hsdj as price,   ---单价
            yw_ckgl_jc_cmd.hsdj,
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

    console.log(sqlstr)
    //logger.info(sqlstr)
    const statSqlstr = `select count(1) as totalCount from yw_ckgl_jc, yw_ckgl_jc_cmd where ${whereClause}
                       `
    //console.log(sqlstr)
    //console.log(statSqlstr)
    return [sqlstr, statSqlstr]

}

async function searchProducts2(params) {
    console.log(params)
    try {
        let sqlstrs = makeSearchProductsSql2(params)
        let pool = await db_pool.getPool(db_config)
        let products = (await pool.query(sqlstrs[0])).recordset
        let totalCount = (await pool.query(sqlstrs[1])).recordset[0]['totalCount']
        products.forEach(product => {
            if (!product.hsje) {
                product.hsje = 0
            }
            product.hsje = product.hsje.toFixed(0)
            if (!product.soldQuantity ) {
                product.soldPrice = 0
            } else {
                product.soldPrice = (product.soldAmount / product.soldQuantity).toFixed(2)
            }
            if (!product.soldAmount) {
                product.soldAmount = 0
            }
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
    var whereClause = ` 1 = 1 and state != '已删除' `
    if (queryobj.keyword) {
        whereClause += `  and gnkhmc+ckdh like '%${queryobj.keyword}%' `
    }
    if (queryobj.payState) {
        if (queryobj.payState == '已收') {

            whereClause += ` and ABS( 
                           isNull((select sum(wxzj) from yw_ckgl_cc_cmd where yw_ckgl_cc_cmd.ckdh = yw_ckgl_cc.ckdh),0)
                         - isNull((select sum(amount) from yw_payments where yw_payments.dh = yw_ckgl_cc.ckdh),0)) <= 0.0001  `
        } else {
            whereClause += ` and ABS( 
                isNull((select sum(wxzj) from yw_ckgl_cc_cmd where yw_ckgl_cc_cmd.ckdh = yw_ckgl_cc.ckdh),0)
              - isNull((select sum(amount) from yw_payments where yw_payments.dh = yw_ckgl_cc.ckdh),0)) > 0.0001 `
        }
    }

    let orderCaluse = ` order by sellDate desc `

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
                yw_ckgl_cc.seller, 
                convert(varchar, sellDate, 23) as sellDate,
                yw_ckgl_cc.bz,   --备注
                yw_ckgl_cc.jw_flag,   --Y
                (select top 1 currency from yw_ckgl_cc_cmd where yw_ckgl_cc_cmd.ckdh = yw_ckgl_cc.ckdh) as currency,
                isNULL((select sum(wxzj) from yw_ckgl_cc_cmd where yw_ckgl_cc_cmd.ckdh = yw_ckgl_cc.ckdh),0) as sellAmount,
                isNULL((select sum(amount) from yw_payments where yw_payments.dh = yw_ckgl_cc.ckdh),0) as payAmount
            FROM yw_ckgl_cc
            where ${whereClause} 
            and ckdh not in (select top ${skipCount} ckdh from yw_ckgl_cc where ${whereClause} ${orderCaluse} )
            ${orderCaluse} `
    logger.info(sqlstr)
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

        orders.forEach( order => {
            order.sellAmount = order.sellAmount || 0
            order.payAmount = order.payAmount || 0
        })
        
        return {
            orders: orders,
            totalCount: totalCount
        }
    } catch (error) {
        logger.error(error)
        return {message: '出错了', orders: [], totalCount: 0}
    } 
}


function makeSearchWaiXiaoOrdersSql(queryobj) {
    console.log(queryobj)
    var whereClause = ` 1=1 and bb_flag='Y' `
    if (queryobj.keyword) {
        whereClause += `  and wxhth like '%${queryobj.keyword}%' `
    }
    if (queryobj.startDate) {
        whereClause += ` and qyrq >= '${queryobj.startDate}'  `
    }
    if (queryobj.endDate) {
        whereClause += ` and qyrq <= '${queryobj.endDate}'  `
    }

    let orderClause = ` order by qyrq desc `

    const skipCount = queryobj.pageSize * (queryobj.pageNo - 1)

    const sqlstr = `select top ${queryobj.pageSize}  
                  
                    wxhth,---外销合同号
                    convert(varchar, qyrq, 23) as 	qyrq,---签约日期
                    zje,---金额
                    wbbb,---币别
                    convert(varchar, Zyqx, 23) as 	zyqx --装运期限
                    From yw_contract
            where ${whereClause} 
            and wxhth not in (select top ${skipCount} wxhth from yw_contract where ${whereClause} ${orderClause} )
            ${orderClause}
           `
    logger.info(sqlstr)
    const statSqlstr = `select count(1) as totalCount from yw_contract where ${whereClause}
                       `
    //console.log(sqlstr)
    //console.log(statSqlstr)
    return [sqlstr, statSqlstr]
}

async function searchWaixiaoOrders(params) {
    console.log(params)
    try {
        let sqlstrs = makeSearchWaiXiaoOrdersSql(params)
        let pool = await db_pool.getPool(db_config)
        let orders = (await pool.query(sqlstrs[0])).recordset
        let totalCount = (await pool.query(sqlstrs[1])).recordset[0]['totalCount']

        orders.forEach( order => {
            order.sellAmount = order.sellAmount || 0
            order.payAmount = order.payAmount || 0
        })
        
        return {
            orders: orders,
            totalCount: totalCount
        }
    } catch (error) {
        logger.error(error)
        return {message: '出错了', orders: [], totalCount: 0}
    } 
}

async function getWxOrderById(id) {
    let sql = `select yw_contract.khms as buyer,zrmbhl, jgtk, po_no, zje, convert(varchar, Zyqx, 23) as zyqx,
         convert(varchar, qyrq, 23) as qyrq, wxhth, bbh, wbbb from yw_contract where wxhth = '${id}'`
    logger.debug(sql)
    try {
        let pool = await db_pool.getPool(db_config)
        let orders = (await pool.query(sql)).recordset
        if (orders.length > 0) {
            let order = orders[0]
            await loadProductsWithWxorder(order)
            await loadFeiyongWithWxorer(order)

            if (!order.wxdj) {
                order.wxdj = 0
            }
            if (!order.wxzj) {
                order.wxzj = 0
            }
            return order
        } else {
            return null
        }
    } catch (error) {
        logger.error(error)
        logger.error(error.stack)
    }
}

async function loadProductsWithWxorder(order) {
    let sql = `SELECT yw_contract_cmd.wxhth,   
                yw_contract_cmd.bbh,   
                yw_contract_cmd.po_no,----订单号,    
                yw_contract_cmd.hgbm,   
                yw_contract_cmd.spbm,   
                yw_contract_cmd.spywmc,---商品名称,   
                yw_contract_cmd.spgg,---规格,   
                yw_contract_cmd.spms,----描述,   
                yw_contract_cmd.sphh,----公司货号,   
                yw_contract_cmd.sphh_kh,---客户货号,   
                yw_contract_cmd.sphh_gc,   
                yw_contract_cmd.sphh_dybz,   
                yw_contract_cmd.lable,   
                yw_contract_cmd.spcolor,   
                yw_contract_cmd.spsl,   
                yw_contract_cmd.sldw,   
                yw_contract_cmd.jjsl,---数量,   
                yw_contract_cmd.jjjs,   
                yw_contract_cmd.jjdw,---数量单位,   
                yw_contract_cmd.wxdj,---单价,   
                yw_contract_cmd.wxdj_dz,   
                yw_contract_cmd.wxzj---总价,    
            FROM yw_contract_cmd 
                where wxhth = '${order.wxhth}' and bbh=${order.bbh}
            `
    try {
        let pool = await db_pool.getPool(db_config)
        let products = (await pool.query(sql)).recordset
        order.products = products
        return order
    } catch (error) {
        logger.error(error)
        logger.error(error.stack)
    }
}

async function loadFeiyongWithWxorer(order) {
    let sql = `SELECT yw_contract.zje,   
                    yw_contract.wbbb,   
                    yw_contract_fy.plus_less,   
                    yw_contract_fy.fymc,   
                    yw_contract_fy.fyje,   
                    yw_contract_fy.fybl,   
                    yw_contract_fy.cxh,   
                    yw_contract.zjems  
                FROM yw_contract,   
                    yw_contract_fy  
                WHERE ( yw_contract.wxhth = yw_contract_fy.wxhth ) and  
                    ( yw_contract.bbh = yw_contract_fy.bbh )
                    and yw_contract.wxhth ='${order.wxhth}'
            `
    try {
        let pool = await db_pool.getPool(db_config)
        let feiyongs = (await pool.query(sql)).recordset
        order.feiyongs = feiyongs
        let totalFeiyong = 0
        if (feiyongs.length > 0) {
            for(var i = 0; i < feiyongs.length; i++) {
                totalFeiyong += feiyongs[i].fyje
                if (feiyongs[i].plus_less == 0) {
                    feiyongs[i].plus_less_des = 'PLUS'
                } else if (feiyongs[i].plus_less == 1) {
                    feiyongs[i].plus_less_des = 'LESS'
                }
            }
        }
        order.totalFeiyong = totalFeiyong
        return order
    } catch (error) {
        logger.error(error)
        logger.error(error.stack)
    }
}

function makeSearchMaolibiaosSql(queryobj) {
    var whereClause = ` 1 = 1 and yw_ckgl_cc.state !='已删除'  and yw_ckgl_cc.ckdh=yw_ckgl_cc_cmd.ckdh `
    var orderClause = ` order by  yw_ckgl_cc.sellDate desc `
    if (queryobj.keyword) {
        whereClause += `  and isNUll(yw_ckgl_cc.xshth, '') + isNUll(yw_ckgl_cc.ckdh, '')
                            +  isNUll(yw_ckgl_cc.gnkhmc, '')
                            + isNUll (yw_ckgl_cc.ywy, '')
                            + isNUll (yw_ckgl_cc_cmd.spzwmc, '')
                            + isNUll ( yw_ckgl_cc_cmd.mxdbh, '') 
                            + isNUll ( yw_ckgl_cc_cmd.sphh, '')  like '%${queryobj.keyword}%' `
    }

    const skipCount = queryobj.pageSize * (queryobj.pageNo - 1)

    const sqlstr = `SELECT top ${queryobj.pageSize} yw_ckgl_cc.ckdh+'_'+yw_ckgl_cc_cmd.spbm as id,
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
                        yw_ckgl_cc.jw_flag,   --Y
                        yw_ckgl_cc.seller,
                        yw_ckgl_cc.mxdbh,

                        yw_ckgl_cc_cmd.spbm,   ---商品编码
                        yw_ckgl_cc_cmd.hgbm,  --海关编码
                        yw_ckgl_cc_cmd.sphh,  --商品货号
                        yw_ckgl_cc_cmd.sphh_kh,    --商品客户货号
                        yw_ckgl_cc_cmd.spzwmc,   --商品中文名称
                        yw_ckgl_cc_cmd.spywmc,   --商品英文名称
                        yw_ckgl_cc_cmd.spgg,   --商品规格
                        yw_ckgl_cc_cmd.sjccsl,    --数量
                        yw_ckgl_cc_cmd.sldw,    --单位
                        yw_ckgl_cc_cmd.hsdj,   ---入库单价
                        (ISNULL((select top 1 ISNULL(wyf,0) + ISNULL(bf,0) from yw_ckgl_jc where yw_ckgl_jc.rkdh =  yw_ckgl_cc_cmd.yrkdh), 0) 
						/ ISNULL((select sum(aa.sjrksl) from yw_ckgl_jc_cmd as aa where aa.rkdh =  yw_ckgl_cc_cmd.yrkdh), 1) + hsdj)
						as unitPrice,     
                        yw_ckgl_cc_cmd.mxdbh, --明细单编号
                        yw_ckgl_cc_cmd.mxd_spid, --明细单ID
                        yw_ckgl_cc_cmd.wxhth, --外销合同号
                        yw_ckgl_cc_cmd.wxht_spid, --外销合同ID
                        yw_ckgl_cc_cmd.wxdj, --销售单价
                        yw_ckgl_cc_cmd.wxzj, --销售金额      
                    ml=wxzj-(ISNULL((select top 1 ISNULL(wyf,0) + ISNULL(bf,0) from yw_ckgl_jc where yw_ckgl_jc.rkdh =  yw_ckgl_cc_cmd.yrkdh), 0) 
                    / ISNULL((select sum(aa.sjrksl) from yw_ckgl_jc_cmd as aa where aa.rkdh =  yw_ckgl_cc_cmd.yrkdh), 1) + hsdj)*sjccsl---毛利
                    FROM yw_ckgl_cc,yw_ckgl_cc_cmd
                    WHERE ${whereClause} and  (yw_ckgl_cc.ckdh+'_'+yw_ckgl_cc_cmd.spbm) not in (
                        select top ${skipCount} yw_ckgl_cc.ckdh+'_'+yw_ckgl_cc_cmd.spbm as id 
                        from yw_ckgl_cc,yw_ckgl_cc_cmd WHERE ${whereClause} ${orderClause}) 
                    ${orderClause}`
    logger.info(sqlstr)
    const statSqlstr = `select count(1) as totalCount from yw_ckgl_cc,yw_ckgl_cc_cmd where ${whereClause}
                       `
    //console.log(sqlstr)
    //console.log(statSqlstr)
    return [sqlstr, statSqlstr]
}

async function searchMaolibiaos(params) {
    console.log(params)
    try {
        let sqlstrs = makeSearchMaolibiaosSql(params)
        let pool = await db_pool.getPool(db_config)
        let orders = (await pool.query(sqlstrs[0])).recordset
        let totalCount = (await pool.query(sqlstrs[1])).recordset[0]['totalCount']

        orders.forEach( order =>  {
            if (!order.hsdj) {
                order.hsdj = 0
            }
            let rkAmount = (order.unitPrice * order.sjccsl).toFixed(2)
            if (!order.ml) {
                order.ml = 0
            }
            if (rkAmount != 0) {
                order.mll = (order.ml.toFixed(2) / rkAmount * 100).toFixed(2)
            } else {
                order.mll = 100
            }
        })
       
        
        return {
            orders: orders,
            totalCount: totalCount
        }
    } catch (error) {
        logger.error(error)
        return {message: '出错了', orders: [], totalCount: 0}
    } 
}

function makeSearchOrderMaolibiaosSql(queryobj) {
    var whereClause = ` 1 = 1 and yw_ckgl_cc.state !='已删除'  `
    var orderClause = ` order by  yw_ckgl_cc.sellDate desc `
    if (queryobj.keyword) {
        whereClause += `  and yw_ckgl_cc.ckdh+yw_ckgl_cc.gnkhmc like '%${queryobj.keyword}%' `
    }

    const skipCount = queryobj.pageSize * (queryobj.pageNo - 1)

    const sqlstr = `SELECT top ${queryobj.pageSize}
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
                        yw_ckgl_cc.jw_flag,   --Y

                        isNULL((select sum( isNULL(hsdj,0) * sjccsl) from yw_ckgl_cc_cmd where yw_ckgl_cc_cmd.ckdh = yw_ckgl_cc.ckdh),0) as rkAmount,
						isNULL((select sum(wxzj) from yw_ckgl_cc_cmd where yw_ckgl_cc_cmd.ckdh = yw_ckgl_cc.ckdh),0) as ckAmount

                    FROM yw_ckgl_cc
                    WHERE ${whereClause} and  yw_ckgl_cc.ckdh not in (
                        select top ${skipCount} yw_ckgl_cc.ckdh
                        from yw_ckgl_cc WHERE ${whereClause} ${orderClause}) 
                    ${orderClause}`
    logger.info(sqlstr)
    const statSqlstr = `select count(1) as totalCount from yw_ckgl_cc where ${whereClause}
                       `
    //console.log(sqlstr)
    //console.log(statSqlstr)
    return [sqlstr, statSqlstr]
}

async function searchOrderMaolibiaos(params) {
    console.log(params)
    try {
        let sqlstrs = makeSearchOrderMaolibiaosSql(params)
        let pool = await db_pool.getPool(db_config)
        let orders = (await pool.query(sqlstrs[0])).recordset
        let totalCount = (await pool.query(sqlstrs[1])).recordset[0]['totalCount']

        orders.forEach( order =>  {
            
            if (order.rkAmount != 0) {
                let ml = order.ckAmount - order.rkAmount
                order.mll = (ml / order.rkAmount * 100).toFixed(2)
            } else {
                order.mll = 100
            }
        })
        
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
        yw_ckgl_jc_cmd.spgg,
        yw_ckgl_jc_cmd.sphh_kh,    --商品客户货号 
        yw_ckgl_jc_cmd.spzwmc as name,   --商品中文名称
        yw_ckgl_jc_cmd.spywmc ,   --商品英文名称
        yw_ckgl_jc_cmd.spgg as spec,   --商品规格
        yw_ckgl_jc_cmd.sjrksl as quantity, --入库数量

        IsNULL( (select sum(sjccsl) from yw_ckgl_cc_cmd
            where yrkdh = yw_ckgl_jc_cmd.rkdh and yrkxh = yw_ckgl_jc_cmd.rkxh), 0) as soldQuantity,  --卖出数量

        yw_ckgl_jc_cmd.sldw,    --单位
        yw_ckgl_jc_cmd.hsje,   --金额

        yw_ckgl_jc_cmd.hsdj as price,   ---单价
        yw_ckgl_jc_cmd.hsdj,
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
            product.isNewAdd = true
        })
        return products
    }
    catch(error) {
        logger.error(error)
        return []
    }
}

function makeSearchInboundOrdersSql(queryobj) {
    var whereClause = ` 1 = 1  `
    if (queryobj.keyword) {
        whereClause += `  and jhdwmc+rkdh like '%${queryobj.keyword}%' `
    }

    if (queryobj.payState) {
        if (queryobj.payState == '已付') {

            whereClause += ` and ABS(rkje - isNull((select sum(amount) from yw_payments where dh = rkdh),0)) <= 0.0001 and rkje > 0 `
        } else {
            whereClause += ` and ABS(rkje - isNull((select sum(amount) from yw_payments where dh = rkdh),0)) > 0.0001 `
        }
    }

    if (queryobj.days != '') {
        whereClause += ` and DATEDIFF(day,rkrq,getDate()) >= ${queryobj.days} `
    }

    let orderCaluse = `  order by rkrq desc `

    const skipCount = queryobj.pageSize * (queryobj.pageNo - 1)

    const sqlstr = `select top ${queryobj.pageSize}  
                rkdh, 
                mxdbh,
                dhbh,
                jhdwmc,
                rkje, 
                (ISNULL(wyf,0) + ISNULL(bf,0) + (Select sum(yw_ckgl_jc_cmd.sjrksl * yw_ckgl_jc_cmd.hsdj) from yw_ckgl_jc_cmd where yw_ckgl_jc_cmd.rkdh = yw_ckgl_jc.rkdh)) as cifTotalAmount,
                (select sum(yw_ckgl_jc_cmd.sjrksl) from yw_ckgl_jc_cmd where yw_ckgl_jc_cmd.rkdh = yw_ckgl_jc.rkdh) as quantity,
                convert(varchar, rkrq, 23) as rkrq,
                isNull((select sum(amount) from yw_payments where dh = yw_ckgl_jc.rkdh), 0) as payAmount
            FROM yw_ckgl_jc
            where ${whereClause} 
            and rkdh not in (select top ${skipCount} rkdh from yw_ckgl_jc where ${whereClause} ${orderCaluse} )
            ${orderCaluse} `
    logger.info(sqlstr)
    const statSqlstr = `select count(1) as totalCount from yw_ckgl_jc where ${whereClause}
                       `
    //console.log(sqlstr)
    //console.log(statSqlstr)
    return [sqlstr, statSqlstr]
}

async function searchInboundOrders(params) {
    console.log(params)
    try {
        let sqlstrs = makeSearchInboundOrdersSql(params)
        let pool = await db_pool.getPool(db_config)
        let orders = (await pool.query(sqlstrs[0])).recordset
        let totalCount = (await pool.query(sqlstrs[1])).recordset[0]['totalCount']
        orders.forEach( order => {
            order.rkje = order.rkje.toFixed(1) * 10 / 10
            try {
                order.days = moment().diff(moment(order.rkrq), 'days')
            } catch (e) {

            }
        })
        return {
            orders: orders,
            totalCount: totalCount
        }
    } catch (error) {
        logger.error(error)
        return {message: '出错了', orders: [], totalCount: 0}
    } 
}

async function addOrUpdateOrder(order) {
    let sql = ``
    let now = moment().format('YYYY-MM-DD HH:mm:ss')

    if (!order.state) {
        logger.error(`state is error，state = ${order.state}`)
        return false
    }

    try {
        let pool = await db_pool.getPool(db_config)

        //计算出出库金额，和每个商品的总额
        let totalAmount = 0  //出库金额
        if (order.products && order.products.length > 0) {
            order.products.forEach(product => {
                product.amount = parseFloat(product.buyQuantity) * parseFloat(product.price)
                totalAmount += product.amount
            })
        }
        logger.debug(`totalAmount = ${totalAmount}`)
        if (order.id) {
            sql = `update yw_ckgl_cc set ckje = ${totalAmount}, xshth = '${order.xshth}', gnkhmc = '${order.clientName}', seller = '${order.seller}', sellDate = '${order.sellDate}',
                          [state] = '${order.state}' where ckdh = '${order.id}'`
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

            sql = `insert into yw_ckgl_cc (ckdh, zdr, zdrq, xshth, gnkhmc, seller, sellDate, [state], ckje)
                  values ('${id}', '111', '${now}', '${order.xshth}', '${order.clientName}', '${order.seller}', '${order.sellDate.substring(0, 10)}', '新制', ${totalAmount})`
            
            logger.info(sql)
            await pool.query(sql)
            
        }

        //插入商品
        let products = order.products
        for(var i = 0; i < products.length; i++) {
            let p = products[i]
            p.sphh = p.sphh || ''
            let ids = p.productId.split('_')
            sql = `
            insert into yw_ckgl_cc_cmd 
            (spbm, hgbm, sphh, sphh_kh, spzwmc, spywmc, spgg, sldw, hsje, hsdj, wxdj, wxzj, ckdh, sjccsl, cxh, productId, currency, huilv, yrkdh, yrkxh, mxdbh)
            values ('${p.spbm}', '${p.hgbm}', '${p.sphh}', '${p.sphh_kh}', '${p.name}', '${p.spywmc}', '${p.spgg}', '${p.sldw}',
             '${p.hsdj * p.buyQuantity}', ${p.hsdj},'${p.price}', ${p.price * p.buyQuantity} ,'${order.id}', 
                '${p.buyQuantity}', '${i}', '${p.productId}', '${p.currency}', '${p.huilv}', '${ids[0]}', '${ids[1]}', '${p.mxdbh}')`
            
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
        sql = `select spbm, hgbm, sphh, sphh_kh,  spzwmc as name, spywmc, spgg, sldw, hsje, hsdj, wxdj as price, sjccsl as buyQuantity, currency, huilv,
                    ckdh, cxh, productId, mxdbh from yw_ckgl_cc_cmd where ckdh = '${id}' order by cxh`
       // logger.info(sql)
        let products = (await pool.query(sql)).recordset
        order.products = products
        order.products.forEach(product => product.id = product.ckdh + '_' + product.cxh)

        //加载图片
        sql = `select imageUrl from yw_ckgl_cc_images where ckdh = '${id}' order by addtime`
       // logger.info(sql)
        let images = (await pool.query(sql)).recordset
        order.images = images

        //加载收款信息
        sql = `select id, dh, amount, tdh, currency, huilv, convert(varchar, addtime, 23) as addtime from yw_payments 
                where dh = '${id}' order by addtime`
        order.payments = (await pool.query(sql)).recordset

        return order
    } catch(error) {
        logger.error(error)
        return null
    }
}

async function deleteOrder(id) {
    try {
        //let sql = `delete from yw_ckgl_cc where ckdh = '${id}'`
        let sql = `update yw_ckgl_cc set [state] = '已删除' where ckdh = '${id}'`
        let pool = await db_pool.getPool(db_config)
        await pool.query(sql)
        return true
    } catch(error) {
        logger.error(error)
        return false
    }
}

async function settleOrder(id) {
    try {
        //let sql = `delete from yw_ckgl_cc where ckdh = '${id}'`
        let sql = `update yw_ckgl_cc set [state] = '已结算' where ckdh = '${id}' and [state] = '出库'`
        let pool = await db_pool.getPool(db_config)
        await pool.query(sql)
        return true
    } catch(error) {
        logger.error(error)
        return false
    }
}

async function getInboundOrderById(id) {
    try {
        let sql = `select mxdbh, rkdh, jhdwmc, 
        convert(varchar, rkrq, 20) as rkrq, wyf, bf
        from yw_ckgl_jc where rkdh = '${id}'`
        logger.debug(sql)
        let pool = await db_pool.getPool(db_config)
        let orders = (await pool.query(sql)).recordset
        if (orders.length == 0) {
            return null
        }
        let order = orders[0]
        //加载productions
        sql = `select 
        wxhth,
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
        yw_ckgl_jc_cmd.hsdj,
        yw_ckgl_jc_cmd.rkxh  --入库序号
        from yw_ckgl_jc_cmd where rkdh = '${id}'`
        order.products = (await pool.query(sql)).recordset

        //加载payments
        sql = `select id, dh, amount, currency, huilv, convert(varchar, addtime, 23) as addtime from yw_payments where dh = '${id}' order by addtime`
        order.payments = (await pool.query(sql)).recordset

        return order
    } catch(error) {
        logger.error(error)
        return null
    }
}

async function addOrUpdatePayment(payment) {
    try {
        let sql = ``
        payment.tdh = payment.tdh || ''
        if (!payment.id) {
            payment.id = uuidv4()
            sql = `insert into yw_payments (id, dh, amount, tdh, currency, huilv) values ('${payment.id}', '${payment.dh}', '${payment.amount}', '${payment.tdh}', '${payment.currency}', '${payment.huilv}')`
        } else {
            sql = `update yw_payments set amount = ${payment.amount}, addtime = '${moment().format('YYYY-MM-DD HH:mm:ss')}',
                    tdh = '${payment.tdh}', currency = '${payment.currency}', huilv = '${payment.huilv}'
             where id = '${payment.id}'`
        }
        logger.debug(sql)
        let pool = await db_pool.getPool(db_config)
        await pool.query(sql)
        return payment.id
    } catch(error) {
        logger.error(error)
        return ''
    }
}

async function deletePayment(id) {
    try {
        let sql = `delete from yw_payments where id = '${id}'`
        let pool = await db_pool.getPool(db_config)
        await pool.query(sql)
        return true

    } catch (error) {
        logger.error(error)
        return false
    }
}

async function login(username, password) {
    try {
        //let sql = `delete from yw_ckgl_cc where ckdh = '${id}'`
        logger.debug(`username = ${username}, password = ${password}`)
        let passwordHash = md5(password).toUpperCase()
        let sql = `select e_no as userId, varchar2 as password, name from rs_employee
                    where e_no = '${username}' and varchar2 = '${passwordHash}' `
        logger.debug(sql)
        let pool = await db_pool.getPool(db_config)
        let result = (await pool.query(sql)).recordset
        //console.log(result)
        if (result.length == 0) {
            return null
        }
        return result[0]
    } catch(error) {
        logger.error(error)
        return null
    }
}

async function changePassword(username, password, newPassword) {
    try {
        //let sql = `delete from yw_ckgl_cc where ckdh = '${id}'`
        let passwordHash = md5(password).toUpperCase()
        let sql = `select * from rs_employee where e_no = '${username}' and varchar2 = '${passwordHash}' `
        console.log(sql)
        let pool = await db_pool.getPool(db_config)
        let result = (await pool.query(sql)).recordset
        if (result.length == 0) {
            return 'origin password is wrong'
        }

        let newPasswordHash = md5(newPassword).toUpperCase()
        sql = `update rs_employee set varchar2 = '${newPasswordHash}' where e_no = '${username}'`
        await pool.query(sql)
        return ''
    } catch(error) {
        logger.error(error)
        return ''
    }
}

function makeOrderId() {
    let id = moment().format('YYMMDDHHMMSS') + Math.floor(Math.random() * 10)
    return id
}


module.exports = {
    searchProducts: searchProducts,
    searchProducts2,
    searchMaolibiaos,
    searchOrderMaolibiaos,
    loadProducts: loadProducts,
    addOrUpdateOrder: addOrUpdateOrder,
    searchOrders: searchOrders,
    getOrderById: getOrderById,
    deleteOrder: deleteOrder,
    settleOrder:  settleOrder,

    searchWaixiaoOrders,
    getWxOrderById,
    
    changePassword,
    login,
    searchInboundOrders,
    addOrUpdatePayment,
    deletePayment,
    getInboundOrderById
}