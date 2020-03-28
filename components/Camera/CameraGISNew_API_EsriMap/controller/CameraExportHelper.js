var indexSTTCategory;
var indexRowCategory;
var levelCategory = 0;
var treeDataCategory;
const date = new Date();
var XLSX = require("xlsx");
var dataXLSX = [];
var wb = XLSX.utils.book_new();
export default class CameraExportHelper {
  static exportData(
    currentLayer,
    cameraData,
    treeData,
    cameraReportData,
    defineConditionCamera,
    defineConditionNotGoodCamera
  ) {
    CameraExportHelper.convertToCSV3(
      currentLayer,
      cameraData,
      treeData,
      cameraReportData,
      defineConditionCamera,
      defineConditionNotGoodCamera
    );
  }
  static convertToCSV3(
    currentLayer,
    cameraData,
    treeData,
    cameraReportData,
    defineConditionCamera,
    defineConditionNotGoodCamera
  ) {
    treeDataCategory = treeData;

    //set level Category
    this.setLevelCategory(treeDataCategory, 0);

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

    dataXLSX = [];

    for (let index = 0; index < cameraData.length; index++) {
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

    var wscols = [
      { wch: 10 },
      { wch: 40 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 }
    ];

    wsOverView["!cols"] = wscols;

    wsOverView["A1"].v =
      "                                                                         Cộng hòa xã hội chủ nghĩa Việt Nam";
    wsOverView["A2"].v =
      "                                                                              Độc lập - Tự do - Hạnh phúc";
    wsOverView["A4"].v =
      "                                                                       BÁO CÁO TÌNH HÌNH CAMERA ĐÃ TÍCH HỢP";
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
    wsOverView["C8"].v = "                   Số Camera";
    wsOverView["D8"].v = "         Số camera hoạt động";
    wsOverView["E8"].v = "         Số camera không hoạt động";
    wsOverView["F8"].v = "         Số camera chất lượng kém";

    let indexSTT = 1;
    let indexRow = 10;
    let listCameraNotGood = cameraReportData.filter(camera => {
      return camera.PhysicalState == "2";
    });

    wsOverView["A9"].v = indexSTT;
    indexSTT++;
    wsOverView["B9"].v = "Tổng số camera đã tích hợp";
    wsOverView["C9"].v = _camAll;
    wsOverView["D9"].v = _camUnbroken;
    wsOverView["E9"].v = _camBroken;
    wsOverView["F9"].v = listCameraNotGood.length;

    // count camera theo danh muc nhu du lich tiep dan...
    treeDataCategory.map(rootCategoty => {
      rootCategoty.children.map(category => {
        if (category.allIDs.length > 0) {
          // nhóm có camera
          let listIdCameraByCategory = [];
          category.allIDs.map(dataIdsCamera => {
            listIdCameraByCategory = listIdCameraByCategory.concat(
              Array.from(dataIdsCamera.monitorIDs)
            );
          });
          let countCameraNotGood = 0;
          listIdCameraByCategory.map(cameraProperty => {
            let cameraNotGood = listCameraNotGood.filter(cameranotGood => {
              return cameranotGood.Id == cameraProperty;
            });
            if (cameraNotGood.length > 0) {
              countCameraNotGood++;
            }
          });
          wsOverView["A" + indexRow].v = indexSTT;
          indexSTT++;
          wsOverView["B" + indexRow].v = "Tổng số camera " + category.name;
          wsOverView["C" + indexRow].v = category.numberAll;
          wsOverView["D" + indexRow].v = category.numberLive;
          wsOverView["E" + indexRow].v =
            category.numberAll - category.numberLive;
          wsOverView["F" + indexRow].v = countCameraNotGood;
          indexRow++;
        } else {
          // nhóm không có camera
          wsOverView["A" + indexRow].v = indexSTT;
          indexSTT++;
          wsOverView["B" + indexRow].v = "Tổng số camera " + category.name;
          wsOverView["C" + indexRow].v = 0;
          wsOverView["D" + indexRow].v = 0;
          wsOverView["E" + indexRow].v = 0;
          wsOverView["F" + indexRow].v = 0;
          indexRow++;
        }
      });
    });

    /* add to workbook */
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsOverView, "Báo cáo chung");

    this.handleReportCameraData(
      cameraReportData,
      defineConditionCamera,
      defineConditionNotGoodCamera
    );

    this.handleSheetConditionCamera(
      cameraData,
      cameraReportData,
      defineConditionCamera,
      defineConditionNotGoodCamera
    );

    //sheet category

    treeDataCategory.map(childDataCategory => {
      // lấy các nhóm ở level 2
      let listNameCategory = childDataCategory.children.map(
        category => category.name
      );
      for (
        let indexCategory = 0;
        indexCategory < listNameCategory.length;
        indexCategory++
      ) {
        var wsCategory = XLSX.utils.json_to_sheet(dataXLSX);
        const mergeCategory = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
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
        const cameraCategory = childDataCategory.children.filter(
          item => item.name === listNameCategory[indexCategory]
        );

        this.handleDataCategory(cameraCategory[0], wsCategory, 0);
        XLSX.utils.book_append_sheet(
          wb,
          wsCategory,
          listNameCategory[indexCategory]
        );
      }
    });

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
    if (category.children.length == 0 && category.levelCategory == 1) {
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

  static handleReportCameraData(
    cameraReportData,
    defineConditionCamera,
    defineConditionNotGoodCamera
  ) {
    var wsOverViewConditionCamera = XLSX.utils.json_to_sheet(dataXLSX);
    const mergeCategory = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }
    ];
    wsOverViewConditionCamera["!merges"] = mergeCategory;

    var wscols = [{ wch: 30 }, { wch: 30 }, { wch: 60 }];

    wsOverViewConditionCamera["!cols"] = wscols;
    wsOverViewConditionCamera["A1"].v =
      "                                                                 THỐNG KÊ TÌNH HÌNH CAMERA ";

    wsOverViewConditionCamera["A3"].v =
      "                              Ngày: " +
      date.getDate() +
      "/" +
      (date.getMonth() + 1) +
      "/" +
      date.getFullYear();
    wsOverViewConditionCamera["C3"].v =
      "             Thời gian xuất báo cáo: " +
      date.getHours() +
      ":" +
      date.getMinutes();

    wsOverViewConditionCamera["A4"].v = "STT";
    wsOverViewConditionCamera["B4"].v = "Danh mục";
    wsOverViewConditionCamera["C4"].v = "Sô camera";

    indexSTTCategory = 1;
    indexRowCategory = 5;

    defineConditionCamera.map(condition => {
      wsOverViewConditionCamera["A" + indexRowCategory].v = indexSTTCategory;
      wsOverViewConditionCamera["B" + indexRowCategory].v =
        condition.Content_vi;
      let countCamera = cameraReportData.filter(camera => {
        return (
          camera.PhysicalState &&
          camera.PhysicalState == condition.Code.toString()
        );
      }).length;
      wsOverViewConditionCamera["C" + indexRowCategory].v = countCamera;
      indexSTTCategory++;
      indexRowCategory++;

      if (condition.Code == 2) {
        defineConditionNotGoodCamera.map(conditionNotGood => {
          wsOverViewConditionCamera[
            "A" + indexRowCategory
          ].v = indexSTTCategory;
          wsOverViewConditionCamera["B" + indexRowCategory].v =
            "         " + conditionNotGood.Content_vi;
          let countCamera = cameraReportData.filter(camera => {
            return camera.PhysicalStateNoteCode.includes(
              conditionNotGood.Code.toString()
            );
          }).length;
          wsOverViewConditionCamera["C" + indexRowCategory].v = countCamera;
          indexSTTCategory++;
          indexRowCategory++;
        });
      }
    });

    XLSX.utils.book_append_sheet(
      wb,
      wsOverViewConditionCamera,
      "Thống kê trạng thái camera"
    );
  }

  static handleSheetConditionCamera(
    cameraData,
    cameraReportData,
    defineConditionCamera,
    defineConditionNotGoodCamera
  ) {
    // console.log(cameraData);
    // console.log(cameraReportData);
    // console.log(defineConditionCamera);
    // console.log(defineConditionNotGoodCamera);
    defineConditionCamera.map(condition => {
      var wsConditionCamera = XLSX.utils.json_to_sheet(dataXLSX);
      const mergeCategory = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
      wsConditionCamera["!merges"] = mergeCategory;

      var wscols = [
        { wch: 10 },
        { wch: 15 },
        { wch: 40 },
        { wch: 50 },
        { wch: 50 }
      ];

      wsConditionCamera["!cols"] = wscols;
      wsConditionCamera["A1"].v =
        "                                           DANH SÁCH CAMERA " +
        condition.Content_vi.toUpperCase();

      wsConditionCamera["A3"].v = "STT";
      wsConditionCamera["B3"].v = "Id Camera";
      wsConditionCamera["C3"].v = "Tên camera";
      wsConditionCamera["D3"].v = "Lĩnh vực/Vị trí";
      wsConditionCamera["E3"].v = "Ghi chú";

      indexSTTCategory = 1;
      indexRowCategory = 4;

      let reportedCameraByCondition = cameraReportData.filter(camera => {
        return camera.PhysicalState == condition.Code.toString();
      });

      reportedCameraByCondition.map(reportedCamera => {
        let printedCamera = cameraData.filter(camera => {
          return camera.id == reportedCamera.Id;
        })[0];

        wsConditionCamera["A" + indexRowCategory].v = indexSTTCategory;
        wsConditionCamera["B" + indexRowCategory].v = reportedCamera.Id;
        wsConditionCamera["C" + indexRowCategory].v = reportedCamera.Name;
        wsConditionCamera["D" + indexRowCategory].v = printedCamera.svalues[0];

        if (reportedCamera.PhysicalState != 2) {
          wsConditionCamera["E" + indexRowCategory].v =
            reportedCamera.PhysicalStateNote;
        } else if (
          reportedCamera.PhysicalStateNoteCode &&
          reportedCamera.PhysicalStateNoteCode != ""
        ) {
          let noteForNotGoodCamera = "";
          defineConditionNotGoodCamera.map(conditionNotGood => {
            if (
              conditionNotGood.Code != 5 &&
              reportedCamera.PhysicalStateNoteCode.includes(
                conditionNotGood.Code.toString()
              )
            ) {
              noteForNotGoodCamera += conditionNotGood.Content_vi + ",";
            }
          });
          wsConditionCamera["E" + indexRowCategory].v =
            noteForNotGoodCamera + " " + reportedCamera.PhysicalStateNote;
        }

        indexSTTCategory++;
        indexRowCategory++;
      });
      XLSX.utils.book_append_sheet(wb, wsConditionCamera, condition.Content_vi);
    });
  }
}

// exports.CameraExportHelper = CameraExportHelper;
