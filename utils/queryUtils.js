const toMysqlFormatDate = (date) => {
    return "'" + date.getUTCFullYear() + "-" + (1 + date.getUTCMonth()) + "-" + date.getUTCDate() + "'";
};

const getProviderConfig = (providerConfig, fromDate, toDate) => {
    const fromMySQL = toMysqlFormatDate(fromDate);
    const toMySQL = toMysqlFormatDate(toDate);

    let query = providerConfig.configs.config.queryData.query;
    query = query
        .replace(new RegExp('{{from_day}}', 'g'), fromMySQL)
        .replace(new RegExp('{{to_day}}', 'g'), toMySQL);
    providerConfig.configs.config.queryData.query = query;

    return providerConfig;
};

export default getProviderConfig;
