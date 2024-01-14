const moment = require('moment');
const db = require("../models");
const functions = require('../routes/functions');
const wordpressConfig = require('../config/wordpress_config')
//web
const getCategsWordpressIds = async () => {
    let objReturn = {tuple_str: `(${wordpressConfig.categoria_noticia_proyecto_id}, `, arr: []};
    let query = `SELECT wordpress_id FROM categoria_noticia WHERE wordpress_id IS NOT NULL AND deleted_at IS NULL`;

    const categIds = await db.sequelize.query(query);
    for(let i = 0; i < categIds[0].length; i++) {
        objReturn.arr.push(categIds[0][i].wordpress_id);
        objReturn.tuple_str += `${categIds[0][i].wordpress_id}`;
        if(i != categIds[0].length-1) {
            objReturn.tuple_str += `, `;
        }
    }
    objReturn.tuple_str += ')';
    return objReturn;
}

const getVisitorsAndVisitsNum = async (targetDate= new Date(), targetDate2=false) => {
    let objReturn = {visitors: 0, visits: 0};
    let targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD');
    let targetDate2Formatted = false;
    let query1 = `SELECT COUNT(ID) AS records_num FROM wp_statistics_visit WHERE last_counter = '${targetDateFormatted}' AND visit > 0`;
    let query2 = `SELECT SUM(visit) AS records_num FROM wp_statistics_visit WHERE last_counter = '${targetDateFormatted}' AND visit > 0`;
    if(targetDate2) {
        targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD');
        targetDate2Formatted = moment(targetDate2).utc().format('YYYY-MM-DD');
        query1 = `SELECT COUNT(ID) AS records_num FROM wp_statistics_visit WHERE last_counter BETWEEN '${targetDateFormatted}' AND '${targetDate2Formatted}' AND visit > 0`;
        query2 = `SELECT SUM(visit) AS records_num FROM wp_statistics_visit WHERE last_counter BETWEEN '${targetDateFormatted}' AND '${targetDate2Formatted}' AND visit > 0`;
    }

    const currentDateVisitorsNum = await db.sequelize.query(query1);
    if(currentDateVisitorsNum[0].length > 0) {
        if(currentDateVisitorsNum[0][0].records_num) {
            objReturn.visitors = currentDateVisitorsNum[0][0].records_num;
        }
    }
    const currentDateVisitsNum = await db.sequelize.query(query2);
    if(currentDateVisitsNum[0].length > 0) {
        if(currentDateVisitsNum[0][0].records_num) {
            objReturn.visits = parseInt(currentDateVisitsNum[0][0].records_num);
        }
    }
    return objReturn;
}

const top10ArticlesDbRequest = async (targetDate= new Date(), targetDate2=false) => {
    let listReturn = [];
    const validCategIds = await getCategsWordpressIds();
    let targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD');
    let targetDate2Formatted = false;
    let query = `
        SELECT DISTINCT
            SUM(wp_statistics_pages.count) AS visits_num,
            wp_posts.ID AS post_id,
            wp_posts.post_title AS post_title
        FROM wp_statistics_pages 
        INNER JOIN wp_posts ON wp_posts.ID = wp_statistics_pages.id
        INNER JOIN wp_term_relationships ON wp_term_relationships.object_id = wp_posts.ID
        INNER JOIN wp_term_taxonomy ON wp_term_taxonomy.term_taxonomy_id = wp_term_relationships.term_taxonomy_id
        INNER JOIN wp_terms ON wp_terms.term_id = wp_term_taxonomy.term_id
        WHERE wp_statistics_pages.date = '${targetDateFormatted}' 
        AND wp_term_taxonomy.taxonomy = 'category'
        AND wp_statistics_pages.id != 0
       /* AND wp_terms.term_id IN ${validCategIds.tuple_str}*/
        LIMIT 10
    `;
    if(targetDate2) {
        targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD');
        targetDate2Formatted = moment(targetDate2).utc().format('YYYY-MM-DD');
        query = `
            SELECT DISTINCT
                SUM(wp_statistics_pages.count) AS visits_num,
                wp_posts.ID AS post_id,
                wp_posts.post_title AS post_title
            FROM wp_statistics_pages 
            INNER JOIN wp_posts ON wp_posts.ID = wp_statistics_pages.id
            INNER JOIN wp_term_relationships ON wp_term_relationships.object_id = wp_posts.ID
            INNER JOIN wp_term_taxonomy ON wp_term_taxonomy.term_taxonomy_id = wp_term_relationships.term_taxonomy_id
            INNER JOIN wp_terms ON wp_terms.term_id = wp_term_taxonomy.term_id
            WHERE wp_statistics_pages.date BETWEEN '${targetDate2Formatted}' AND '${targetDateFormatted}' 
            AND wp_term_taxonomy.taxonomy = 'category'
            AND wp_statistics_pages.id != 0
            /*AND wp_terms.term_id IN ${validCategIds.tuple_str}*/
            LIMIT 10
        `;
    }

    const request = await db.sequelize.query(query);
    let total = 0;

    if(request[0].length > 0) {
        for(let i = 0; i < request[0].length; i++) {
            let record = request[0][i];
            if(!record.visits_num) {
                record.visits_num = "0";
            }
            record.visits_num = parseInt(record.visits_num);
            total += record.visits_num;
            listReturn.push(record);
        }
    }
    for(let i = 0; i < listReturn.length; i++) {
        if(total != 0) {
            listReturn[i].percentage = (listReturn[i].visits_num/total)*100;
        } else {
            listReturn[i].percentage = 0;
        }
    }
    return listReturn;
}

const getTop10Articles = async (period="today", periodDates={}) => {
    const res = {
        status: 'success', 
        data: [], 
        msg: ''
    };
    const currentDate = new Date();
    let yesterday = new Date();
    let lastWeek = new Date();
    let last14Days = new Date();
    let lastMonth = new Date();
    let last60days = new Date();
    let last90days = new Date();
    let last120days = new Date();
    let last6Months = new Date();
    let lastYear = new Date();
    yesterday.setHours(yesterday.getHours()-24);
    lastWeek.setHours(lastWeek.getHours()-168);
    last14Days.setHours(last14Days.getHours()-336);
    lastMonth.setHours(lastMonth.getHours()-720);
    last60days.setHours(last60days.getHours()-1440);
    last90days.setHours(last90days.getHours()-2160);
    last120days.setHours(last120days.getHours()-2880);
    last6Months.setHours(last6Months.getHours()-4368);
    lastYear.setHours(lastYear.getHours()-8760);

    try {
        let dbRequestRes = [];
        let date1 = currentDate;
        let date2 = [];
        if(period === 'today') {
            dbRequestRes = await top10ArticlesDbRequest(currentDate);
            res.data = dbRequestRes;
            return res;
        }
        if(period === 'yesterday') {
            dbRequestRes = await top10ArticlesDbRequest(yesterday);
            res.data = dbRequestRes;
            return res;
        }

        if(period === 'lastWeek') {
            date2 = lastWeek;
        }

        if(period === 'last14days') {
            date2 = last14Days;
        }

        if(period === 'lastMonth') {
            date2 = lastMonth;
        }

        if(period === 'last60days') {
            date2 = last60days;
        }

        if(period === 'last90days') {
            date2 = last90days;
        }

        if(period === 'last120days') {
            date2 = last120days;
        }

        if(period === 'last6Months') {
            date2 = last6Months;
        }

        if(period === 'lastYear') {
            date2 = lastYear;
        }

        if(period === 'periodDates') {
            date1 = new Date(periodDates.init);
            date2 = new Date(periodDates.finish);
            let diff = finishDate.getTime() - initDate.getTime();
            if(diff < 0) {
                date1 = new Date(periodDates.finish);
                date2 = new Date(periodDates.init);
            }
        }

        dbRequestRes = await top10ArticlesDbRequest(date1, date2);
        res.data = dbRequestRes;

    } catch(err) {
        console.log(err)
        res.status = 'error';
    }

    return res;
}

const top10CategoriesDbRequest = async (targetDate= new Date(), targetDate2=false) => {
    let listReturn = [];
    const validCategIds = await getCategsWordpressIds();
    let targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD');
    let targetDate2Formatted = false;
    let query = `
        SELECT DISTINCT
            SUM(wp_statistics_pages.count) AS visits_num,
            wp_terms.name AS category_name
        FROM wp_statistics_pages 
        INNER JOIN wp_posts ON wp_posts.ID = wp_statistics_pages.id
        INNER JOIN wp_term_relationships ON wp_term_relationships.object_id = wp_posts.ID
        INNER JOIN wp_term_taxonomy ON wp_term_taxonomy.term_taxonomy_id = wp_term_relationships.term_taxonomy_id
        INNER JOIN wp_terms ON wp_terms.term_id = wp_term_taxonomy.term_id
        WHERE wp_statistics_pages.date = '${targetDateFormatted}' 
        AND wp_term_taxonomy.taxonomy = 'category'
        AND wp_statistics_pages.id != 0
        /*AND wp_terms.term_id IN ${validCategIds.tuple_str}*/
        LIMIT 10
    `;
    if(targetDate2) {
        targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD');
        targetDate2Formatted = moment(targetDate2).utc().format('YYYY-MM-DD');
        query = `
            SELECT DISTINCT
                SUM(wp_statistics_pages.count) AS visits_num,
                wp_terms.name AS category_name
            FROM wp_statistics_pages 
            INNER JOIN wp_posts ON wp_posts.ID = wp_statistics_pages.id
            INNER JOIN wp_term_relationships ON wp_term_relationships.object_id = wp_posts.ID
            INNER JOIN wp_term_taxonomy ON wp_term_taxonomy.term_taxonomy_id = wp_term_relationships.term_taxonomy_id
            INNER JOIN wp_terms ON wp_terms.term_id = wp_term_taxonomy.term_id
            WHERE wp_statistics_pages.date BETWEEN '${targetDate2Formatted}' AND '${targetDateFormatted}' 
            AND wp_term_taxonomy.taxonomy = 'category'
            AND wp_statistics_pages.id != 0
            /*AND wp_terms.term_id IN ${validCategIds.tuple_str}*/
            LIMIT 10
        `;
    }
    let total = 0;
    const request = await db.sequelize.query(query);
    if(request[0].length > 0) {
        for(let i = 0; i < request[0].length; i++) {
            let record = request[0][i];
            if(!record.visits_num) {
                record.visits_num = "0";
            }
            record.visits_num = parseInt(record.visits_num);
            total += record.visits_num;
            listReturn.push(record);
        }
    }
    for(let i = 0; i < listReturn.length; i++) {
        if(total != 0) {
            listReturn[i].percentage = (listReturn[i].visits_num/total)*100;
        } else {
            listReturn[i].percentage = 0;
        }
    }
    return listReturn;
}

const getTop10Categories = async (period="today", periodDates={}) => {
    let res = {
        status: 'success', 
        data: [], 
        msg: ''
    };
    if(!period) {
        res = {
            status: 'error', 
            data: [], 
            msg: ''
        };
        return res;
    }
    const currentDate = new Date();
    let yesterday = new Date();
    let lastWeek = new Date();
    let last14Days = new Date();
    let lastMonth = new Date();
    let last60days = new Date();
    let last90days = new Date();
    let last120days = new Date();
    let last6Months = new Date();
    let lastYear = new Date();
    yesterday.setHours(yesterday.getHours()-24);
    lastWeek.setHours(lastWeek.getHours()-168);
    last14Days.setHours(last14Days.getHours()-336);
    lastMonth.setHours(lastMonth.getHours()-720);
    last60days.setHours(last60days.getHours()-1440);
    last90days.setHours(last90days.getHours()-2160);
    last120days.setHours(last120days.getHours()-2880);
    last6Months.setHours(last6Months.getHours()-4368);
    lastYear.setHours(lastYear.getHours()-8760);

    try {
        let dbRequestRes = [];
        let date1 = currentDate;
        let date2 = [];
        if(period === 'today') {
            dbRequestRes = await top10CategoriesDbRequest(currentDate);
            res.data = dbRequestRes;
            return res;
        }
        if(period === 'yesterday') {
            dbRequestRes = await top10CategoriesDbRequest(yesterday);
            res.data = dbRequestRes;
            return res;
        }

        if(period === 'lastWeek') {
            date2 = lastWeek;
        }

        if(period === 'last14days') {
            date2 = last14Days;
        }

        if(period === 'lastMonth') {
            date2 = lastMonth;
        }

        if(period === 'last60days') {
            date2 = last60days;
        }

        if(period === 'last90days') {
            date2 = last90days;
        }

        if(period === 'last120days') {
            date2 = last120days;
        }

        if(period === 'last6Months') {
            date2 = last6Months;
        }

        if(period === 'lastYear') {
            date2 = lastYear;
        }

        if(period === 'periodDates') {
            if(!periodDates.init) {
                res = {
                    status: 'error', 
                    data: [], 
                    msg: ''
                };
                return res;
            }
            if(!periodDates.finish) {
                res = {
                    status: 'error', 
                    data: [], 
                    msg: ''
                };
                return res;
            }
            date1 = new Date(periodDates.init);
            date2 = new Date(periodDates.finish);
            let diff = finishDate.getTime() - initDate.getTime();
            if(diff < 0) {
                date1 = new Date(periodDates.finish);
                date2 = new Date(periodDates.init);
            }
        }

        dbRequestRes = await top10CategoriesDbRequest(date1, date2);
        res.data = dbRequestRes;

    } catch(err) {
        console.log(err)
        res.status = 'error';
    }

    return res;
}

const getTendenciaTraficoDiario = async (period="today", periodDates={}) => {
    const currentDate = new Date();
    let res = {
        status: 'success', 
        data: [], 
        msg: ''
    };
    
    if(!period) {
        res = {
            status: 'errpr', 
            data: [], 
            msg: ''
        };
        return res;
    }

    try {
        let yesterday = new Date();
        yesterday.setHours(yesterday.getHours()-24);
        let days = 0;

        if(period === 'today') {
            let todayRes = await getVisitorsAndVisitsNum(currentDate);
            res.data.push([moment(currentDate).utc().format('YY-MM-DD'), todayRes]);
            return res;
        }
        if(period === 'yesterday') {
            let todayRes = await getVisitorsAndVisitsNum(currentDate);
            let yesterdayRes = await getVisitorsAndVisitsNum(yesterday);
            res.data.push([moment(currentDate).utc().format('YY-MM-DD'), todayRes]);
            res.data.push([moment(yesterday).utc().format('YY-MM-DD'), yesterdayRes]);
            return res;
        }

        if(period === 'lastWeek') {
            days = 7;
        }

        if(period === 'last14days') {
            days = 14;
        }

        if(period === 'lastMonth') {
            days = 30;
        }

        if(period === 'last60days') {
            days = 60;
        }

        if(period === 'last90days') {
            days = 90;
        }

        if(period === 'last120days') {
            days = 120;
        }

        if(period === 'last6Months') {
            days = 182;
        }

        if(period === 'lastYear') {
            days = 365;
        }

        if(period === 'periodDates') {
            if(!periodDates.init) {
                res = {
                    status: 'errpr', 
                    data: [], 
                    msg: ''
                };
                return res;
            }
            if(!periodDates.finish) {
                res = {
                    status: 'errpr', 
                    data: [], 
                    msg: ''
                };
                return res;
            }
            let initDate = new Date(periodDates.init);
            let finishDate = new Date(periodDates.finish);
            let diff = finishDate.getTime() - initDate.getTime();
            if(diff < 0) {
                diff = diff*(-1);
                initDate = new Date(periodDates.finish);
                finishDate = new Date(periodDates.init);
            }
            diff = diff / 1000; //segundos
            diff = diff / 3600; //horas
            diff = parseInt(diff / 24); //dias
            
            for(let i = 0; i < diff; i++) {
                let targetDate = new Date(periodDates.init);
                targetDate = targetDate.setHours(targetDate.getHours()-(24*i));
                let targetDateRes = await getVisitorsAndVisitsNum(targetDate);
                res.data.push([moment(targetDate).utc().format('YY-MM-DD'), targetDateRes]);
            }
            return res;
        }

        for(let i = 0; i < days; i++) {
            let targetDate = new Date();
            targetDate.setHours(targetDate.getHours()-(24*i));
            let targetDateStr = targetDate.toISOString();
            let targetDateRes = await getVisitorsAndVisitsNum(targetDate);
            res.data.push([moment(targetDate).utc().format('YY-MM-DD'), targetDateRes]);
        }
    } catch(err) {
        console.log(err)
        res.status = 'error';
    }

    return res;
}

const getResumenTrafico = async () => {
    const res = {
        status: 'success', 
        data: {
            today: {visitors: 0, visits: 0},
            yesterday: {visitors: 0, visits: 0},
            lastWeek:{visitors: 0, visits: 0},
            lastMonth:{visitors: 0, visits: 0},
            last60days:{visitors: 0, visits: 0},
            last90days:{visitors: 0, visits: 0},
            last120days:{visitors: 0, visits: 0},
            thisYear:{visitors: 0, visits: 0},
            lastYear:{visitors: 0, visits: 0},
            total:{visitors: 0, visits: 0},
        }, 
        msg: ''
    };
    const currentDate = new Date();
    let yesterday = new Date();
    let lastWeek = new Date();
    let lastMonth = new Date();
    let last60days = new Date();
    let last90days = new Date();
    let last120days = new Date();
    let currentYearFirstDay = new Date(`${currentDate.getFullYear()}-01-01`);
    let lastYear = new Date();

    try {
        yesterday.setHours(yesterday.getHours()-24);
        lastWeek.setHours(lastWeek.getHours()-168);
        lastMonth.setHours(lastMonth.getHours()-720);
        last60days.setHours(last60days.getHours()-1440);
        last90days.setHours(last90days.getHours()-2160);
        last120days.setHours(last120days.getHours()-2880);
        lastYear.setHours(lastYear.getHours()-8760);
    
        //getting data
        res.data.today = await getVisitorsAndVisitsNum(currentDate);
        res.data.yesterday = await getVisitorsAndVisitsNum(yesterday);
        res.data.lastWeek = await getVisitorsAndVisitsNum(currentDate, lastWeek);
        res.data.lastMonth = await getVisitorsAndVisitsNum(currentDate, lastMonth);
        res.data.last60days = await getVisitorsAndVisitsNum(currentDate, last60days);
        res.data.last90days = await getVisitorsAndVisitsNum(currentDate, last90days);
        res.data.last120days = await getVisitorsAndVisitsNum(currentDate, last120days);
        res.data.thisYear = await getVisitorsAndVisitsNum(currentDate, currentYearFirstDay);
        res.data.lastYear = await getVisitorsAndVisitsNum(currentDate, lastYear);
        res.data.total.visitors += (res.data.lastYear.visitors + res.data.today.visitors)
        res.data.total.visits += (res.data.lastYear.visits + res.data.today.visits)

    } catch(err) {
        console.log(err)
        res.status = 'error';
    }

    return res;
}

//web
exports.top10Articulos = async (req, res) => {
    try {
        const option = req.query.option;
        const date1 = req.query.date_1;
        const date2 = req.query.date_2;
        const dataRes = await getTop10Articles(option, {init: date1, finish: date2});
        res.status(200).send(dataRes.data);
    } catch(err) {
      res.status(500).send();
    }
};

exports.top10Categorias = async (req, res) => {
    try {
        const option = req.query.option;
        const date1 = req.query.date_1;
        const date2 = req.query.date_2;
        const dataRes = await getTop10Categories(option, {init: date1, finish: date2});
        res.status(200).send(dataRes.data);
    } catch(err) {
      res.status(500).send();
    }
};

exports.tendenciaTraficoDiario = async (req, res) => {
    try {
        let dataRes = []
        let option = req.query.option;
        let date1 = req.query.date_1;
        let date2 = req.query.date_2;
        if(!option) {
            option = 'today';
        }
        let getData = await getTendenciaTraficoDiario(option, {init: date1, finish: date2});
        if(getData.status === 'success') {
            dataRes = getData.data.reverse();
        }
        res.status(200).send(dataRes);
    } catch(err) {
        console.log(err); 
      res.status(500).send();
    }
};

exports.visitasWebGeneral = async (req, res) => { 
  try {
            /*
            -today
            -yesterday
            -lastWeek
            -last14days
            -lastMonth
            -last60days
            -last90days
            -last120days
            -last6Months
            -lastYear
            -periodDates
        */
    const dataRes = {status: 'success', data: {}, msg: ''};
    const resumenTrafico = await getResumenTrafico();
    const tendenciaTraficoDiario = await getTendenciaTraficoDiario('lastWeek');
    const top10Categories = await getTop10Categories('lastWeek');
    const top10Articles = await getTop10Articles('lastWeek');
    if(resumenTrafico.status === 'success') {
        dataRes.data.resumen_trafico = resumenTrafico.data;
    }
    if(tendenciaTraficoDiario.status === 'success') {
        dataRes.data.tendencia_trafico_diario = tendenciaTraficoDiario.data.reverse();
    }
    if(top10Categories.status === 'success') {
        dataRes.data.top_10_categories = top10Categories.data.reverse();
    }
    if(top10Articles.status === 'success') {
        dataRes.data.top_10_articles = top10Articles.data.reverse();
    }
    res.status(200).send(dataRes);
  } catch(err) {
    res.status(500).send();
  }
};

//radio
const getVisitorsAndVisitsRadioDbRequest = async (targetDate= new Date(), targetDate2=false) => {
    let objReturn = {visitors: 0, visits: 0};
    let targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD');
    let targetDate2Formatted = false;
    let query1 = `
        SELECT COUNT(visitors.ip) AS records_num FROM
        (
            SELECT DISTINCT ip 
            FROM radio_visualizacion 
            WHERE created_at BETWEEN '${targetDateFormatted} 00:00:01' 
            AND '${targetDateFormatted} 23:59:59' 
            AND count > 0
            AND deleted_at IS NULL
        ) AS visitors
    `;
    let query2 = `
        SELECT SUM(count) AS records_num FROM radio_visualizacion 
        WHERE created_at BETWEEN '${targetDateFormatted} 00:00:01' AND '${targetDateFormatted} 23:59:59' 
        AND count > 0
        AND deleted_at IS NULL
    `;
    if(targetDate2) {
        targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD HH:mm:ss');
        targetDate2Formatted = moment(targetDate2).utc().format('YYYY-MM-DD HH:mm:ss');
        query1 = `
            SELECT COUNT(visitors.ip) AS records_num FROM
            (
                SELECT COUNT(ip) AS records_num 
                FROM radio_visualizacion 
                WHERE created_at BETWEEN '${targetDateFormatted}' AND '${targetDate2Formatted}' 
                AND count > 0
                AND deleted_at IS NULL
            ) AS visitors
        `;
        query2 = `
            SELECT SUM(count) AS records_num FROM radio_visualizacion 
            WHERE created_at BETWEEN '${targetDateFormatted}' AND '${targetDate2Formatted}' 
            AND count > 0
            AND deleted_at IS NULL
        `;
    }

    const currentDateVisitorsNum = await db.sequelize.query(query1);
    if(currentDateVisitorsNum[0].length > 0) {
        objReturn.visitors = currentDateVisitorsNum[0][0].records_num;
    }
    const currentDateVisitsNum = await db.sequelize.query(query2);
    if(currentDateVisitsNum[0].length > 0) {
        objReturn.visits = parseInt(currentDateVisitsNum[0][0].records_num);
    }
    return objReturn;
}

const getVisitasRadio = async (period, periodDates) => {
    const currentDate = new Date();
    let res = {
        status: 'success', 
        data: [], 
        msg: ''
    };
    
    if(!period) {
        res = {
            status: 'error', 
            data: [], 
            msg: ''
        };
        return res;
    }

    try {
        let yesterday = new Date();
        yesterday.setHours(yesterday.getHours()-24);
        let days = 0;

        if(period === 'today') {
            let todayRes = await getVisitorsAndVisitsRadioDbRequest(currentDate);
            res.data.push([moment(currentDate).utc().format('YYYY-MM-DD'), todayRes]);
            return res;
        }
        if(period === 'yesterday') {
            let todayRes = await getVisitorsAndVisitsRadioDbRequest(currentDate);
            let yesterdayRes = await getVisitorsAndVisitsRadioDbRequest(yesterday);
            res.data.push([moment(currentDate).utc().format('YYYY-MM-DD'), todayRes]);
            res.data.push([moment(yesterday).utc().format('YYYY-MM-DD'), yesterdayRes]);
            return res;
        }

        if(period === 'lastWeek') {
            days = 7;
        }

        if(period === 'last14days') {
            days = 14;
        }

        if(period === 'lastMonth') {
            days = 30;
        }

        if(period === 'last60days') {
            days = 60;
        }

        if(period === 'last90days') {
            days = 90;
        }

        if(period === 'last120days') {
            days = 120;
        }

        if(period === 'last6Months') {
            days = 182;
        }

        if(period === 'lastYear') {
            days = 365;
        }

        if(period === 'periodDates') {
            if(!periodDates.init) {
                res = {status: 'errpr', data: [], msg: ''};
                return res;
            }
            if(!periodDates.finish) {
                res = {status: 'errpr', data: [], msg: ''};
                return res;
            }

            if(diff < 0) {
                diff = diff*(-1);
                initDate = new Date(periodDates.finish);
                finishDate = new Date(periodDates.init);
            }

            let initDate = new Date(periodDates.init);
            let finishDate = new Date(periodDates.finish);
            let diff = finishDate.getTime() - initDate.getTime();

            diff = diff / 1000; //segundos
            diff = diff / 3600; //horas
            diff = parseInt(diff / 24); //dias
            
            for(let i = 0; i < diff; i++) {
                let targetDate = new Date(periodDates.init);
                targetDate = targetDate.setHours(targetDate.getHours()-(24*i));
                let targetDateRes = await getVisitorsAndVisitsRadioDbRequest(targetDate);
                res.data.push([moment(targetDate).utc().format('YYYY-MM-DD'), targetDateRes]);
            }
            return res;
        }

        for(let i = 0; i < days; i++) {
            let targetDate = new Date();
            targetDate.setHours(targetDate.getHours()-(24*i));
            let targetDateRes = await getVisitorsAndVisitsRadioDbRequest(targetDate);
            res.data.push([moment(targetDate).utc().format('YYYY-MM-DD'), targetDateRes]);
        }
    } catch(err) {
        console.log(err)
        res.status = 'error';
    }

    return res;
}

exports.visitasRadio = async (req, res) => {
    try {
        let option = req.query.option;
        let date1 = req.query.date_1;
        let date2 = req.query.date_2;
        if(!option) {
            option = 'today';
        }
        const dataRes = await getVisitasRadio(option, {init: date1, finish: date2});
        res.status(200).send(dataRes);
    } catch(err) {
      res.status(500).send();
    }
};

const suscripcionesRadioDdbRequest = async (targetDate= new Date(), targetDate2=false) => {
    let objReturn = 0
    let targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD');
    let targetDate2Formatted = false;
    let query = `
        SELECT COUNT(suscriptors.user_id) AS records_num FROM
        (
            SELECT DISTINCT user_id FROM suscripcion 
            WHERE fecha_suscripcion BETWEEN '${targetDateFormatted} 00:00:01' AND '${targetDateFormatted} 23:59:59' 
            AND activa = TRUE
            AND deleted_at IS NULL
        ) AS suscriptors
    `;
    if(targetDate2) {
        targetDateFormatted = moment(targetDate).utc().format('YYYY-MM-DD HH:mm:ss');
        targetDate2Formatted = moment(targetDate2).utc().format('YYYY-MM-DD HH:mm:ss');
        query = `
            SELECT COUNT(suscriptors.user_id) AS records_num FROM
            (
                SELECT DISTINCT user_id FROM suscripcion 
                WHERE fecha_suscripcion BETWEEN '${targetDateFormatted}' AND '${targetDateFormatted}' 
                AND activa = TRUE
                AND deleted_at IS NULL
            ) AS suscriptors
        `;
    }
    const res = await db.sequelize.query(query);
    if(res[0].length > 0) {
        objReturn = parseInt(res[0][0].records_num);
    }
    return objReturn;
}

const getSuscripcionesRadio = async (period, periodDates) => {
    const currentDate = new Date();
    let res = {
        status: 'success', 
        data: [], 
        msg: ''
    };
    
    if(!period) {
        res = {
            status: 'error', 
            data: [], 
            msg: ''
        };
        return res;
    }

    try {
        let yesterday = new Date();
        yesterday.setHours(yesterday.getHours()-24);
        let days = 0;

        if(period === 'today') {
            let todayRes = await suscripcionesRadioDdbRequest(currentDate);
            res.data.push([moment(currentDate).utc().format('YYYY-MM-DD'), todayRes]);
            return res;
        }
        if(period === 'yesterday') {
            let todayRes = await suscripcionesRadioDdbRequest(currentDate);
            let yesterdayRes = await suscripcionesRadioDdbRequest(yesterday);
            res.data.push([moment(currentDate).utc().format('YYYY-MM-DD'), todayRes]);
            res.data.push([moment(yesterday).utc().format('YYYY-MM-DD'), yesterdayRes]);
            return res;
        }

        if(period === 'lastWeek') {
            days = 7;
        }

        if(period === 'last14days') {
            days = 14;
        }

        if(period === 'lastMonth') {
            days = 30;
        }

        if(period === 'last60days') {
            days = 60;
        }

        if(period === 'last90days') {
            days = 90;
        }

        if(period === 'last120days') {
            days = 120;
        }

        if(period === 'last6Months') {
            days = 182;
        }

        if(period === 'lastYear') {
            days = 365;
        }

        if(period === 'periodDates') {
            if(!periodDates.init) {
                res = {status: 'errpr', data: [], msg: ''};
                return res;
            }
            if(!periodDates.finish) {
                res = {status: 'errpr', data: [], msg: ''};
                return res;
            }

            if(diff < 0) {
                diff = diff*(-1);
                initDate = new Date(periodDates.finish);
                finishDate = new Date(periodDates.init);
            }

            let initDate = new Date(periodDates.init);
            let finishDate = new Date(periodDates.finish);
            let diff = finishDate.getTime() - initDate.getTime();

            diff = diff / 1000; //segundos
            diff = diff / 3600; //horas
            diff = parseInt(diff / 24); //dias
            
            for(let i = 0; i < diff; i++) {
                let targetDate = new Date(periodDates.init);
                targetDate = targetDate.setHours(targetDate.getHours()-(24*i));
                let targetDateRes = await suscripcionesRadioDdbRequest(targetDate);
                res.data.push([moment(targetDate).utc().format('YYYY-MM-DD'), targetDateRes]);
            }
            return res;
        }

        for(let i = 0; i < days; i++) {
            let targetDate = new Date();
            targetDate.setHours(targetDate.getHours()-(24*i));
            let targetDateRes = await suscripcionesRadioDdbRequest(targetDate);
            res.data.push([moment(targetDate).utc().format('YYYY-MM-DD'), targetDateRes]);
        }
    } catch(err) {
        console.log(err)
        res.status = 'error';
    }

    return res;
}

exports.suscripcionesRadio = async (req, res) => {
    try {
        let option = req.query.option;
        let date1 = req.query.date_1;
        let date2 = req.query.date_2;
        if(!option) {
            option = 'today';
        }
        const dataRes = await getSuscripcionesRadio(option, {init: date1, finish: date2});
        res.status(200).send(dataRes);
    } catch(err) {
      res.status(500).send();
    }
};

exports.radioOnlineGeneral = async (req, res) => {
    try {
        const dataRes = {status: 'success', data: {}, msg: ''};
        const visitas_radio = await getVisitasRadio('lastWeek');
        const suscripciones_radio = await getSuscripcionesRadio('lastWeek');

        if(visitas_radio.status === 'success') {
            dataRes.data.visitas_radio = visitas_radio.data.reverse();
        }
        if(suscripciones_radio.status === 'success') {
            dataRes.data.suscripciones_radio = suscripciones_radio.data.reverse();
        }
        res.status(200).send(dataRes);
    } catch(err) {
    res.status(500).send();
    }
};