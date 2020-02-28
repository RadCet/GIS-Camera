import moment from "moment/moment";

export default function getDefaultPeriodDate() {
    return {
        startDate: moment().subtract(3, 'months').toDate(),
        endDate: moment().toDate()
    };
}