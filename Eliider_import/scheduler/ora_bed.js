const oracledb = require('oracledb');
const schedule = require('node-schedule');
const pool = require('../../config/database')

const { oraConnection } = require('../../config/oracleConn');
const { checkOrarBedMastAlredyExcist } = require('./Func/FilterFunction');

const bedJob = schedule.scheduleJob('0 */6 * * *', async () => {

    let oraPool = await oraConnection();
    let oraConn = await oraPool.getConnection();

    try {
        // Get data From oracle database "OUTLET" table
        const result = await oraConn.execute(
            `SELECT 
                bd_code,
                bdc_no,
                rt_code,
                ns_code,
                rm_code,
                bdc_hour,
                bdc_occup,
                bdn_occno,
                bdc_status,
                bdd_eddate,
                dp_code,
                bdc_minhour,
                do_code,
                hkd_lastcleandate,
                hkd_cleaningreq,
                bdc_mhcode,
                bdc_vipbed,
                bdc_allowcatgchange,
                bdc_extrabed,
                bdc_opoccupied
            FROM BED`,
            [],
            { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        const bedMasterDataFromOra = await result.resultSet?.getRows();

        //Inser to My sql Database "ora_outlet" table
        checkOrarBedMastAlredyExcist((bedMasterDataFromMySql) => {
            const bedCode = bedMasterDataFromMySql.map((val) => val.bd_code);

            let newArray = bedMasterDataFromOra?.filter((value) => {
                return bedCode.includes(value.BD_CODE) === true ? null : value;
            })

            newArray && newArray?.map((value, index) => {
                console.log(value)
                pool.query(
                    `INSERT INTO ora_bed
                        (bd_code,
                        bdc_no,
                        rt_code,
                        ns_code,
                        rm_code,
                        bdc_hour,
                        bdc_occup,
                        bdn_occno,
                        bdc_status,
                        bdd_eddate,
                        dp_code,
                        bdc_minhour,
                        do_code,
                        hkd_lastcleandate,
                        hkd_cleaningreq,
                        bdc_mhcode,
                        bdc_vipbed,
                        bdc_allowcatgchange,
                        bdc_extrabed,
                        bdc_opoccupied)
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [
                        value.BD_CODE,
                        value.BDC_NO,
                        value.RT_CODE,
                        value.NS_CODE,
                        value.RM_CODE,
                        value.BDC_HOUR,
                        value.BDC_OCCUP,
                        value.BDN_OCCNO,
                        value.BDC_STATUS,
                        value.BDD_EDDATE,
                        value.DP_CODE,
                        value.BDC_MINHOUR,
                        value.DO_CODE,
                        value.HKD_LASTCLEANDATE,
                        value.HKD_CLEANINGREQ,
                        value.BDC_MHCODE,
                        value.BDC_VIPBED,
                        value.BDC_ALLOWCATGCHANGE,
                        value.BDC_EXTRABED,
                        value.BDC_OPOCCUPIED
                    ],
                    (error, result) => {
                        if (error) throw error;
                    }
                )
            })

        })

    } catch (err) {
        console.log(err)
    } finally {
        console.log('bed-completed')
        if (oraConn) {
            await oraConn.close();
            await oraPool.close(3)
        }
    }

})

module.exports = {
    bedJob
}
