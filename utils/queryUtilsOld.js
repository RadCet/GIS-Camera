
// Gia tri bang mac dinh theo kieu thoi gian xem
import moment from "moment/moment";

const viewTypeFromTos = {
    nam: {
        tableType: 'thang',
        queryType: 'thang2thang',
        timeFormat: "CONCAT(Month, \'/\', Year)",
        from: 1,
        to: 12,
        year: moment().year(),
        groupBy: 'Month, Year'
    },
    quy: {
        tableType: 'thang',
        queryType: 'thang2thang',
        timeFormat: "CONCAT(Month, \'/\', Year)",
        from: moment().startOf('quarter').month() + 1,
        to: moment().endOf('quarter').month() + 1,
        year: moment().year(),
        groupBy: 'Month, Year'
    },
    thang: {
        tableType: 'tuan',
        queryType: 'tuan2tuan',
        timeFormat: "Week",
        from: moment().startOf('month').week(),
        to: moment().endOf('month').week(),
        year: moment().year(),
        groupBy: 'Week, Year'
    },
    tuan: {
        tableType: 'ngay',
        queryType: 'ngay2ngay',
        timeFormat: "Day",
        from: moment().day('Monday').startOf('day').toDate(),
        to: moment().day('Saturday').endOf('day').toDate(),
        year: moment().year(),
        groupBy: 'Date(Day)'
    },
    ngay: {
        tableType: 'gio',
        queryType: 'gio2gio',
        timeFormat: "Hour",
        from: moment().startOf('day').toDate(),
        to: moment().endOf('day').toDate(),
        day: moment().toDate(),
        groupBy: 'Date(Hour), Hour(Hour)'
    },
    gio: {
        tableType: 'phut',
        queryType: 'phut2phut',
        timeFormat: "Minute",
        from: moment().startOf('hour').toDate(),
        to: moment().endOf('hour').toDate(),
        year: (new Date()).getFullYear(),
        groupBy: 'Date(Minute), Hour(Minute), Minute(Minute)'
    },
    phut: {
        tableType: 'giay',
        queryType: 'giay2giay',
        timeFormat: "Second",
        from: moment().startOf('minute').toDate(),
        to: moment().endOf('minute').toDate(),
        year: (new Date()).getFullYear(),
        groupBy: 'Date(Second), Hour(Second), Minute(Second), Second(Second)'
    }
};

const viewTypes = {
    nam: {
        tableType: 'nam',
        queryType: 'nam',
        from: 1,
        to: 12,
        year: moment().year(),
    },
    quy: {
        tableType: 'quy',
        queryType: 'quy',
        quarter: moment().quarter(),
        year: moment().year()
    },
    thang: {
        tableType: 'thang',
        queryType: 'thang',
        month: moment().month() + 1,
        year: moment().year()
    },
    tuan: {
        tableType: 'tuan',
        queryType: 'tuan',
        week: moment().week(),
        year: moment().year()
    },
    ngay: {
        tableType: 'ngay',
        queryType: 'ngay',
        day: moment().toDate()
    },
    gio: {
        tableType: 'gio',
        queryType: 'gio',
        hour: moment().toDate(),
    }
};

const queryConditions = {
    phut: "Date(Minute) = Date({{minute}}) and Hour(Minute) = Hour({{minute}}) and Minute(Minute) = Minute({{minute}})",
    phut2phut: "Date(Minute) = Date({{from_minute}}) and Date(Minute) = Date({{to_minute}}) and Hour(Minute) = Hour({{from_minute}}) and Hour(Minute) == Hour({{to_minute}}) and Minute(Minute) >= Minute({{from_minute}}) and Minute(Minute) <= Minute({{to_minute}})",

    gio: "Date(Hour) = Date({{hour}}) and Hour(Hour) = Hour({{hour}})",
    gio2gio: "Date(Hour) = Date({{from_hour}}) and Date(Hour) = Date({{to_hour}}) and Hour(Hour) >= Hour({{from_hour}}) and Hour(Hour) <= Hour({{to_hour}})",

    ngay: "Date(Day) = Date({{day}})",
    ngay2ngay: "Date(Day) >= Date({{from_day}}) and Date(Day) <= Date({{to_day}})",

    tuan: "Week = {{week}} and Year = {{year}}",
    tuan2tuan: "Week >= {{from_week}} and Week <= {{to_week}} and Year = {{year}}",

    thang: "Month = {{month}} and Year = {{year}}",
    thang2thang: "Month >= {{from_month}} and Month <= {{to_month}} and Year = {{year}}",

    quy: "Quarter = {{quarter}} and Year = {{year}}",
    quy2quy: "Quarter >= {{from_quarter}} and Quarter <= {{to_quarter}} and Year = {{year}}",

    nam: "Year = {{year}}",
    nam2nam: "Year >= {{year}} and Year <= {{year}}"
};

// query: {from, to, year} || {month, year} .... tuy theo viewType
const getProviderConfig = (providerConfig, viewType, isFromTo, queryTime) => {
    let viewData;
    if (isFromTo) {
        viewData = viewTypeFromTos[viewType];
    } else {
        viewData = viewTypes[viewType];
    }

    if(!viewData) throw Exception('viewType khong hop le.');

    viewData = Object.assign({}, viewData, queryTime);

    // queryConditions
    const {tableType, queryType, from, to, year, day, week, month, quarter, timeFormat, groupBy} = viewData;
    let queryConditions = providerConfig.queryConditions ? providerConfig.queryConditions[queryType] : queryConditions;
    if (queryType === 'ngay') {
        queryConditions = queryConditions
            .replace(new RegExp('{{day}}', 'g'), day);

    } else if (queryType === 'tuan') {
        queryConditions = queryConditions
            .replace(new RegExp('{{week}}', 'g'), week);

    } else if (queryType === 'thang') {
        queryConditions = queryConditions
            .replace(new RegExp('{{month}}', 'g'), month)

    } else if (queryType === 'quy') {
        queryConditions = queryConditions
            .replace(new RegExp('{{quarter}}', 'g'), quarter);

    } else if (queryType === 'ngay2ngay') {
        queryConditions = queryConditions
            .replace(new RegExp('{{from_day}}', 'g'), from)
            .replace(new RegExp('{{to_day}}', 'g'), to);

    } else if (queryType === 'tuan2tuan') {
        queryConditions = queryConditions
            .replace(new RegExp('{{from_week}}', 'g'), from)
            .replace(new RegExp('{{to_week}}', 'g'), to);

    } else if (queryType === 'thang2thang') {
        queryConditions = queryConditions
            .replace(new RegExp('{{from_month}}', 'g'), from)
            .replace(new RegExp('{{to_month}}', 'g'), to);

    } else if (queryType === 'quy2quy') {
        queryConditions = queryConditions
            .replace(new RegExp('{{from_quarter}}', 'g'), from)
            .replace(new RegExp('{{to_quarter}}', 'g'), to);

    } else if (queryType === 'nam2nam') {
        queryConditions = queryConditions
            .replace(new RegExp('{{from_year}}', 'g'), from)
            .replace(new RegExp('{{to_year}}', 'g'), to);
    }
    queryConditions = queryConditions
        .replace(new RegExp('{{year}}', 'g'), year);

    // query
    let query = providerConfig.configs.config.queryData.query;
    query = query
        .replace(new RegExp('{{queryConditions}}', 'g'), queryConditions)
        .replace(new RegExp('{{type}}', 'g'), tableType)
        .replace(new RegExp('{{timeFormat}}', 'g'), timeFormat)
        .replace(new RegExp('{{groupBy}}', 'g'), groupBy);

    providerConfig.configs.config.queryData.query = query;

    // tablename
    let tableNameConfig = providerConfig.configs.config.tableName;
    tableNameConfig = tableNameConfig.replace(new RegExp('{{type}}', 'g'), tableType);
    providerConfig.configs.config.tableName = tableNameConfig;

    return providerConfig;
};

export default getProviderConfig;
