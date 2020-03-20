let conditionNotGoodCamera = [];
let stringPhysicalStateNoteCode = "";
if (conditionNotGoodCamera.length > 0) {
  conditionNotGoodCamera.map((idError, index) => {
    if (index < conditionNotGoodCamera.length - 1) {
      stringPhysicalStateNoteCode += idError + ",";
    } else {
      stringPhysicalStateNoteCode += idError;
    }
  });
} else {
  stringPhysicalStateNoteCode = "asdasd";
}

console.log(stringPhysicalStateNoteCode);
