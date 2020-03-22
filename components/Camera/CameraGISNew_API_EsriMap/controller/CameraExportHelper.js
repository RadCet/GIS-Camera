var indexSTTCategory;
var indexRowCategory;
var levelCategory = 0;
var treeDataCategory;
export default class CameraExportHelper {
    static exportData(currentLayer, cameraData, treeData) {
        CameraExportHelper.convertToCSV3(
            { children: treeData },
            currentLayer,
            cameraData
        );
    }

    static convertToCSV(title, cameraData) {
        let str = '"' + title + '"\n';
        str += "Id, Tên, Địa chỉ, Kinh độ, Vĩ độ\n";
        cameraData.map(camera => {
            str += camera.vmsCamId + ",";
            str += '"' + camera.name + '",';
            str += '"' + camera.address + '",';
            str += camera.longitude + ",";
            str += camera.latitude + "\n";
        });
        str += "Tổng, " + cameraData.length + "\n\n\n";
        return str;
    }

    static convertToCSV2(result, treeData, currentLayer) {
        // const { currentLayer } = this.state;

        if (
            treeData.name &&
            treeData.value &&
            (typeof currentLayer == "undefined" ||
                treeData.value.startsWith(currentLayer))
        ) {
            if (!treeData.level) {
                result.value += "\n";
            }

            let title = treeData.name;
            if (treeData.level) {
                if (treeData.level == 1) title = "   " + title;
                else title = "        " + title;
            }

            result.value += '"' + title + '",';
            result.value += treeData.liveLength + ",";
            result.value += treeData.allLength + "\n";
        }
        if (treeData.children) {
            for (let i = 0; i < treeData.children.length; i++) {
                CameraExportHelper.convertToCSV2(result, treeData.children[i]);
            }
        }
    }

    static convertToCSV3(treeData, currentLayer, cameraData) {
        // const { currentLayer, cameraData} = this.state;
        treeDataCategory = treeData;
        this.setLevelCategory(treeDataCategory.children, 0);
        // console.log(treeDataCategory);

        //set level Category

        let listNameCategory = treeDataCategory.children.map(
            category => category.name
        );

        let cameraDataByLayer = cameraData.filter(item => {
            return (
                typeof currentLayer == "undefined" ||
                item.values.find(item => item.startsWith(currentLayer)) != null
            );
        });

        const tmpArr = [];
        const cameraTmp = [];
        cameraDataByLayer.map(item => {
            if (!tmpArr.includes(item.vmsCamId)) {
                cameraTmp.push(item);
                tmpArr.push(item.vmsCamId);
            }
        });
        cameraDataByLayer = cameraTmp;

        const _camBroken = cameraDataByLayer.filter(item => item.level === 0)
            .length;

        const _camActive = cameraDataByLayer.filter(item => item.level === 1)
            .length;
        const _camUnactive = cameraDataByLayer.filter(item => item.level === 2)
            .length;
        const _camUnbroken = _camActive + _camUnactive;

        const _camAINoEvent = cameraDataByLayer.filter(item => item.ailevel === 3)
            .length;
        const _camAI5pEvent = cameraDataByLayer.filter(item => item.ailevel === 4)
            .length;
        const _camAI24hEvent = cameraDataByLayer.filter(item => item.ailevel === 5)
            .length;
        const _camAI = _camAINoEvent + _camAI5pEvent + _camAI24hEvent;
        const _camAll = _camBroken + _camUnbroken;

        var XLSX = require("xlsx");
        var dataXLSX = [];

        for (let index = 0; index < 10000; index++) {
            let object = {
                " ": "",
                "   ": "",
                "      ": "",
                "         ": "",
                "          ": "",
                "           ": "",
                "            ": ""
            };
            dataXLSX.push(object);
        }

        /* this line is only needed if you are not adding a script tag reference */
        if (typeof XLSX == "undefined") XLSX = require("xlsx");

        /* make the worksheet */
        // sheet1
        var wsOverView = XLSX.utils.json_to_sheet(dataXLSX);
        //set range in file excel
        // ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 100, r: 100 } });

        const merge = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
            { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }
            // { s: { r: 6, c: 2 }, e: { r: 6, c: 3 } }
        ];
        wsOverView["!merges"] = merge;

        var wscols = [{ wch: 10 }, { wch: 40 }, { wch: 45 }];

        wsOverView["!cols"] = wscols;

        const date = new Date();
        wsOverView["A1"].v =
            "                                                                         Cộng hòa xã hội chủ nghĩa Việt Nam";
        wsOverView["A2"].v =
            "                                                                              Độc lập - Tự do - Hạnh phúc";
        wsOverView["A4"].v =
            "                          BÁO CÁO TÌNH HÌNH CAMERA ĐÃ TÍCH HỢP LÊN TRUNG TÂM ĐIỀU HÀNH IOC TỈNH QUẢNG NINH";
        wsOverView["B6"].v =
            "          Ngày: " +
            date.getDate() +
            "/" +
            (date.getMonth() + 1) +
            "/" +
            date.getFullYear();
        wsOverView["C6"].v =
            "          Thời gian xuất báo cáo: " +
            date.getHours() +
            ":" +
            date.getMinutes();

        wsOverView["A8"].v = "STT";
        wsOverView["B8"].v = "               Tiêu chí báo cáo";
        wsOverView["C8"].v = "                   Kết quả";

        let indexSTT = 1;
        let indexRow = 10;

        wsOverView["A9"].v = indexSTT;
        indexSTT++;
        wsOverView["B9"].v = "Tổng số camera đã tích hợp";
        wsOverView["C9"].v = _camAll;

        // count huyen co camera tiep dan, hanh chinh cong
        let countDistricTiepDan = 0;
        let countDistricHanhChinhCong = 0;
        treeDataCategory.children
            .filter(category => {
                return (
                    category.name === "Tiếp Dân" || category.name === "Hành Chính Công"
                );
            })
            .map(type => {
                wsOverView["A" + indexRow].v = indexSTT;
                indexSTT++;
                wsOverView["B" + indexRow].v = "Số huyện có camera " + type.name;
                wsOverView["C" + indexRow].v = type.children.length;
                if (type.name === "Tiếp Dân") {
                    countDistricTiepDan = type.children.length;
                } else if (type.name === "Hành Chính Công") {
                    countDistricHanhChinhCong = type.children.length;
                }
                indexRow++;
            });

        // count xa co camera tiep dan, hanh chinh cong
        treeDataCategory.children
            .filter(category => {
                return (
                    category.name === "Tiếp Dân" || category.name === "Hành Chính Công"
                );
            })
            .map(type => {
                let totalWard = 0;
                type.children.map(ward => {
                    totalWard += ward.children.length;
                });
                wsOverView["A" + indexRow].v = indexSTT;
                indexSTT++;
                wsOverView["B" + indexRow].v = "Số xã có camera " + type.name;
                if (type.name === "Tiếp Dân") {
                    wsOverView["C" + indexRow].v = totalWard - countDistricTiepDan;
                } else if (type.name === "Hành Chính Công") {
                    wsOverView["C" + indexRow].v = totalWard - countDistricHanhChinhCong;
                }
                indexRow++;
            });

        // count camera theo danh muc nhu du lich tiep dan...
        treeDataCategory.children.map(categoty => {
            wsOverView["A" + indexRow].v = indexSTT;
            indexSTT++;
            wsOverView["B" + indexRow].v = "Tổng số camera " + categoty.name;
            wsOverView["C" + indexRow].v = categoty.numberAll;
            indexRow++;
        });

        /* add to workbook */
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsOverView, "Báo cáo chung");

        //sheet category
        // listNameCategory.map(nameCategory => {
        for (
            let indexCategory = 0;
            indexCategory < listNameCategory.length;
            indexCategory++
        ) {
            var wsCategory = XLSX.utils.json_to_sheet(dataXLSX);
            const mergeCategory = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
                // { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
                // { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
                // { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
                // { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
                // { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },
            ];
            wsCategory["!merges"] = mergeCategory;

            var wscols = [{ wch: 10 }, { wch: 30 }, { wch: 30 }, { wch: 30 }];

            wsCategory["!cols"] = wscols;
            wsCategory["A1"].v =
                "                                           BÁO CÁO TÌNH HÌNH CAMERA " +
                listNameCategory[indexCategory].toUpperCase();

            wsCategory["A3"].v = "STT";
            wsCategory["B3"].v = "Tên đơn vị";
            wsCategory["C3"].v = "Sô camera hoạt động";
            wsCategory["D3"].v = "Số camera không hoạt động";

            indexSTTCategory = 1;
            indexRowCategory = 4;
            const cameraCategory = treeDataCategory.children.filter(
                item => item.name === listNameCategory[indexCategory]
            );

            this.handleDataCategory(cameraCategory[0], wsCategory, 0);
            XLSX.utils.book_append_sheet(
                wb,
                wsCategory,
                listNameCategory[indexCategory]
            );
        }

        /* generate an XLSX file */
        let fileTitle =
            "Thong_ke_Camera_" +
            date.getFullYear() +
            "_" +
            (date.getMonth() + 1) +
            "_" +
            date.getDate() +
            "_" +
            date.getHours() +
            "_" +
            date.getMinutes();
        XLSX.writeFile(wb, fileTitle + ".xlsx");
    }

    static handleDataCategory(category, wsCategory) {
        if (category.children.length == 0 && category.levelCategory == 0) {
            wsCategory["A" + indexRowCategory].v = indexSTTCategory;
            indexSTTCategory++;
            wsCategory["B" + indexRowCategory].v = category.name;
            wsCategory["C" + indexRowCategory].v = category.numberLive;
            wsCategory["D" + indexRowCategory].v =
                category.numberAll - category.numberLive;
            indexRowCategory++;
        } else {
            for (let index = 0; index < category.children.length; index++) {
                // console.log(category.children[index], levelCategory);

                if (category.children[index].children.length == 0) {
                    wsCategory["A" + indexRowCategory].v = indexSTTCategory;
                    indexSTTCategory++;
                    let whiteSpace = "";
                    for (let i = 1; i < category.children[index].levelCategory; i++) {
                        whiteSpace += "     ";
                    }
                    wsCategory["B" + indexRowCategory].v =
                        whiteSpace + category.children[index].name;
                    wsCategory["C" + indexRowCategory].v =
                        category.children[index].numberLive;
                    wsCategory["D" + indexRowCategory].v =
                        category.children[index].numberAll -
                        category.children[index].numberLive;
                    indexRowCategory++;
                } else {
                    wsCategory["A" + indexRowCategory].v = indexSTTCategory;
                    indexSTTCategory++;
                    let whiteSpace = "";
                    for (let i = 1; i < category.children[index].levelCategory; i++) {
                        whiteSpace += "     ";
                    }
                    wsCategory["B" + indexRowCategory].v =
                        whiteSpace + category.children[index].name;
                    wsCategory["C" + indexRowCategory].v =
                        category.children[index].numberLive;
                    wsCategory["D" + indexRowCategory].v =
                        category.children[index].numberAll -
                        category.children[index].numberLive;
                    indexRowCategory++;

                    this.handleDataCategory(category.children[index], wsCategory);
                }
            }
        }
    }

    static setLevelCategory(treeCategory) {
        let index = 0;
        for (index = 0; index < treeCategory.length; index++) {
            if (treeCategory[index].children.length == 0) {
                // console.log(treeCategory[index], levelCategory);
                treeCategory[index].levelCategory = levelCategory;
            } else {
                // console.log(treeCategory[index], levelCategory);
                treeCategory[index].levelCategory = levelCategory;
                levelCategory++;
                this.setLevelCategory(treeCategory[index].children);
            }
        }
        if (index == treeCategory.length && levelCategory > 0) {
            levelCategory--;
        }
    }
}

// exports.CameraExportHelper = CameraExportHelper;