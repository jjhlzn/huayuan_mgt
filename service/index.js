
const db_pool = require('../lib/db_pool')
const db_config = require('../lib/db_config')
const { v4: uuidv4 } = require('uuid');
const logger = require('../lib/logger')('service/index.js')
const _ = require('underscore')

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
            yw_ckgl_jc.rkrq,   --入库日期
            yw_ckgl_jc.ywy,   --业务员
            yw_ckgl_jc.bm,   --部门
            yw_ckgl_jc.tt_no,   --抬头
            yw_ckgl_jc.cfck,    --存放仓库
            yw_ckgl_jc.dhbh,   ---提单号
            yw_ckgl_jc_cmd.spbm,   ---商品编码
            yw_ckgl_jc_cmd.hgbm,  --海关编码
            yw_ckgl_jc_cmd.sphh,  --商品货号
            yw_ckgl_jc_cmd.sphh_kh,    --商品客户货号 
            yw_ckgl_jc_cmd.spzwmc,   --商品中文名称
            yw_ckgl_jc_cmd.spywmc,   --商品英文名称
            yw_ckgl_jc_cmd.spgg,   --商品规格
            yw_ckgl_jc_cmd.sjrksl, --入库数量
            yw_ckgl_jc_cmd.sldw,    --单位
            yw_ckgl_jc_cmd.hsje,   --金额
            yw_ckgl_jc_cmd.hsdj,   ---单价
            yw_ckgl_jc_cmd.rkxh,  --入库序号
            yw_ckgl_jc_cmd.mxdbh, --明细单编号
            yw_ckgl_jc_cmd.mxd_spid, --明细单ID
            yw_ckgl_jc_cmd.wxhth, --外销合同号
            yw_ckgl_jc_cmd.wxht_spid, --外销合同ID
            c_ycksl = (select sum(b.ccsl) from yw_ckgl_cc_cmd b, yw_ckgl_cc c 
                            where b.ckdh = c.ckdh and 
                                    yw_ckgl_jc_cmd.rkdh = b.yrkdh and 
                                    yw_ckgl_jc_cmd.rkxh = b.yrkxh) ,
            yw_ckgl_jc_cmd.rktzdh,
            yw_ckgl_jc_cmd.rktzdh_cxh
            FROM yw_ckgl_jc,   
                yw_ckgl_jc_cmd
            where ${whereClause} 
            and id not in (select top ${skipCount} id from ${logTable} where ${whereClause} order by time, seq)
            order by time, seq`

    const statSqlstr = `select count(1) as totalCount from ${logTable} where ${whereClause}
                       `
    console.log(sqlstr)
    console.log(statSqlstr)
    return [sqlstr, statSqlstr]

}

async function getProducts(params) {
    try {
        let pool = await db_pool.getPool(db_config)
        let sqlstr = `
        SELECT top 5 yw_ckgl_jc.rkdh,   --入库单号
        yw_ckgl_jc.rkrq,   --入库日期
        yw_ckgl_jc.ywy,   --业务员
        yw_ckgl_jc.bm,   --部门
        yw_ckgl_jc.tt_no,   --抬头
        yw_ckgl_jc.cfck,    --存放仓库
        yw_ckgl_jc.dhbh,   ---提单号
        yw_ckgl_jc_cmd.spbm,   ---商品编码
        yw_ckgl_jc_cmd.hgbm,  --海关编码
        yw_ckgl_jc_cmd.sphh,  --商品货号
        yw_ckgl_jc_cmd.sphh_kh,    --商品客户货号 
        yw_ckgl_jc_cmd.spzwmc,   --商品中文名称
        yw_ckgl_jc_cmd.spywmc,   --商品英文名称
        yw_ckgl_jc_cmd.spgg,   --商品规格
        yw_ckgl_jc_cmd.sjrksl, --入库数量
        yw_ckgl_jc_cmd.sldw,    --单位
        yw_ckgl_jc_cmd.hsje,   --金额
        yw_ckgl_jc_cmd.hsdj,   ---单价
        yw_ckgl_jc_cmd.rkxh,  --入库序号
        yw_ckgl_jc_cmd.mxdbh, --明细单编号
        yw_ckgl_jc_cmd.mxd_spid, --明细单ID
        yw_ckgl_jc_cmd.wxhth, --外销合同号
        yw_ckgl_jc_cmd.wxht_spid, --外销合同ID
        c_ycksl = (select sum(b.ccsl) from yw_ckgl_cc_cmd b, yw_ckgl_cc c 
                           where b.ckdh = c.ckdh and 
                                   yw_ckgl_jc_cmd.rkdh = b.yrkdh and 
                                   yw_ckgl_jc_cmd.rkxh = b.yrkxh) ,
        yw_ckgl_jc_cmd.rktzdh,
        yw_ckgl_jc_cmd.rktzdh_cxh
        FROM yw_ckgl_jc,   
                yw_ckgl_jc_cmd
        WHERE ( yw_ckgl_jc.rkdh = yw_ckgl_jc_cmd.rkdh ) and   
                ( yw_ckgl_jc.state in ('复核','入库') )  and
        yw_ckgl_jc_cmd.sjrksl > 
                        isnull((select sum(b.ccsl) from yw_ckgl_cc_cmd b, yw_ckgl_cc c 
                                where b.ckdh = c.ckdh and 
                                        yw_ckgl_jc_cmd.jcbh = b.jcbh and 
                                        yw_ckgl_jc_cmd.jcxh = b.jcxh and
                                        yw_ckgl_jc_cmd.rktzdh = b.rktzdh and 
                                        yw_ckgl_jc_cmd.rktzdh_cxh = b.rktzdh_cxh),0)
        `
        let products = (await pool.query(sqlstr)).recordset
        console.log(products)
        return {
            products: products,
            totalCount: 0
        }
    } catch (error) {
        logger.error(error)
        return {error_code: -1}
    } 

    
}


module.exports = {
    getProducts: getProducts
}