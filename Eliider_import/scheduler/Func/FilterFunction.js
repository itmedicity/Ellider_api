const pool = require('../../../config/database')

//USER TABLE 
let checkOraUserAlredyExcist = (callBack) => {
    pool.query(
        `SELECT us_code FROM  meliora.ora_users`,
        [],
        (error, result) => {
            if (error) throw error;
            return callBack(JSON.parse(JSON.stringify(result)));
        }
    )
}

//OUTLET TABLE
let checkOraOutletAlredyExcist = (callBack) => {
    pool.query(
        `SELECT ou_code FROM meliora.ora_outlet`,
        [],
        (error, result) => {
            if (error) throw error;
            return callBack(JSON.parse(JSON.stringify(result)));
        }
    )
}

//OUTLET TABLE
let checkOraNursStationAlredyExcist = (callBack) => {
    pool.query(
        `SELECT ns_code FROM meliora.ora_nurstation`,
        [],
        (error, result) => {
            if (error) throw error;
            return callBack(JSON.parse(JSON.stringify(result)));
        }
    )
}

//DOCTOR TABLE
let checkOraDoctorAlredyExcist = (callBack) => {
    pool.query(
        `SELECT do_code FROM meliora.ora_doctor`,
        [],
        (error, result) => {
            if (error) throw error;
            return callBack(JSON.parse(JSON.stringify(result)));
        }
    )
}

//ROOM CATEGORY TABLE
let checkOrarRoomCategoryAlredyExcist = (callBack) => {
    pool.query(
        `SELECT rc_code FROM meliora.ora_roomcategory`,
        [],
        (error, result) => {
            if (error) throw error;
            return callBack(JSON.parse(JSON.stringify(result)));
        }
    )
}

//ROOM TYPE TABLE
let checkOrarRoomTypeAlredyExcist = (callBack) => {
    pool.query(
        `SELECT rt_code FROM meliora.ora_roomtype`,
        [],
        (error, result) => {
            if (error) throw error;
            return callBack(JSON.parse(JSON.stringify(result)));
        }
    )
}


//ROOM MASTER TABLE
let checkOrarRoomMasterAlredyExcist = (callBack) => {
    pool.query(
        `SELECT rm_code FROM meliora.ora_roommaster`,
        [],
        (error, result) => {
            if (error) throw error;
            return callBack(JSON.parse(JSON.stringify(result)));
        }
    )
}


//BED MASTER TABLE
let checkOrarBedMastAlredyExcist = (callBack) => {
    pool.query(
        `SELECT bd_code FROM meliora.ora_bed`,
        [],
        (error, result) => {
            if (error) throw error;
            return callBack(JSON.parse(JSON.stringify(result)));
        }
    )
}


module.exports = {
    checkOraUserAlredyExcist,
    checkOraOutletAlredyExcist,
    checkOraNursStationAlredyExcist,
    checkOraDoctorAlredyExcist,
    checkOrarRoomCategoryAlredyExcist,
    checkOrarRoomTypeAlredyExcist,
    checkOrarRoomMasterAlredyExcist,
    checkOrarBedMastAlredyExcist
}