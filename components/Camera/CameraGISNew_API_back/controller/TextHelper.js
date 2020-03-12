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
}