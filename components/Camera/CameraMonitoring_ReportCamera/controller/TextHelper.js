export class TextHelper {

    constructor(options) {
        this.options = options;
    }

    static normalText(string) {
        let input = string;
        // TODO normal input
        let output =  input.toLowerCase()
            .replace(/[\s\.\-]/g, "")
            .replace(/đ/g, "d")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        // console.log(`normalText:${input}:${output}`);
        return output;
    }

    static getTSearch(object, fields) {
        let tSearch = [];
        if (typeof(object) !== "object" || !Array.isArray(fields)) {
            return tSearch;
        }
        fields.forEach(field => {
            let value = object[field];
            if (typeof(value) === "string" && value.length > 0) {
                let valueNormaled = TextHelper.normalText(value);
                if (valueNormaled != null && valueNormaled.length > 0) {
                    tSearch.push(valueNormaled);
                }
            } else if (Array.isArray(value)) {
                value.filter(item => typeof(item) === "string" && item.length > 0)
                    .map(item => TextHelper.normalText(item))
                    .filter(item => item != null && item.length > 0)
                    .forEach(item => tSearch.push(item));
            }
        });
        return tSearch;
    }
}