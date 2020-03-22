import React from "react";
import ReactDOM from "react-dom";
import {
  Modal,
  Form,
  Select,
  Input,
  Button,
  message,
  Spin,
  List,
  Icon,
  Avatar
} from "antd";
const { TextArea } = Input;
const FormItem = Form.Item;
const Option = Select.Option;
import "antd/dist/antd.css";
import "./styles/SubmitForm.css";
import { id } from "date-fns/locale";

class FormSubmitStatusCamera1 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      listConditionCamera: [],
      listConditionNotGoodCamera: [],
      idCamera: "",
      showOptionNotGoodCamera: false,
      showNoteTextArea: false,
      loading: true,
      dataHistoryReport: [],
      showHistoryReport: false,
      totalRecordReport: 0,
      recordPerPage: 0
    };

    this.setupFormSubmit = this.setupFormSubmit.bind(this);
    this.resetDataForm = this.resetDataForm.bind(this);
    this.getDataInforCameraCondition = this.getDataInforCameraCondition.bind(
      this
    );
    this.getHistoryReportCamera = this.getHistoryReportCamera.bind(this);
  }

  componentDidMount() {
    this.setState({
      showModal: this.props.showSubmitForm
    });

    // const { cameraVMSController } = this.props;
    // if (cameraVMSController != null) {
    // }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.idCamera &&
      (this.state.idCamera == "" ||
        prevState.idCamera != this.state.idCamera ||
        prevProps.idCamera != this.props.idCamera)
    ) {
      this.setState({
        idCamera: this.props.idCamera
      });
    }

    if (
      prevProps.showSubmitForm != this.props.showSubmitForm ||
      prevState.showModal != this.state.showModal
    ) {
      const {
        cameraVMSController,
        defineConditionCamera,
        defineConditionNotGoodCamera
      } = this.props;
      this.setState({
        showModal: this.props.showSubmitForm,
        showHistoryReport: false
      });
      if (cameraVMSController != null) {
        if (this.state.showModal) {
          this.setupFormSubmit(
            defineConditionCamera,
            defineConditionNotGoodCamera
          );
        } else {
          this.resetDataForm();
        }
      }
    }
  }

  componentWillUnmount() {
    // this.searchBox.removeListener('places_changed', this.onPlacesChanged);
  }

  setupFormSubmit(defineConditionCamera, defineConditionNotGoodCamera) {
    let listConditionCamera = [];
    for (let index = 0; index < defineConditionCamera.length; index++) {
      listConditionCamera.push(
        <Option key={defineConditionCamera[index].Code}>
          {defineConditionCamera[index].Content_vi}
        </Option>
      );
    }
    let listConditionNotGoodCamera = [];
    for (let index = 0; index < defineConditionNotGoodCamera.length; index++) {
      listConditionNotGoodCamera.push(
        <Option key={defineConditionNotGoodCamera[index].Code}>
          {defineConditionNotGoodCamera[index].Content_vi}
        </Option>
      );
    }
    this.setState({
      listConditionCamera: listConditionCamera,
      listConditionNotGoodCamera: listConditionNotGoodCamera
    });
    this.getDataInforCameraCondition(this.state.idCamera);
    this.getHistoryReportCamera(this.state.idCamera, {});
  }

  resetDataForm() {
    this.props.form.setFieldsValue({
      conditionCamera: undefined,
      conditionNotGoodCamera: undefined,
      noteContent: undefined
    });

    this.setState({
      dataHistoryReport: []
    });
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({
          loading: true
        });

        //handle data before submit
        let stringPhysicalStateNoteCode = "";
        if (values.conditionNotGoodCamera != undefined) {
          values.conditionNotGoodCamera.map((idError, index) => {
            if (index < values.conditionNotGoodCamera.length - 1) {
              stringPhysicalStateNoteCode += idError + ",";
            } else {
              stringPhysicalStateNoteCode += idError;
            }
          });
        } else {
          stringPhysicalStateNoteCode = "";
        }

        let stringNoteContent = "";
        if (values.noteContent !== undefined) {
          stringNoteContent = values.noteContent;
        } else {
          stringNoteContent = "";
        }

        let paramData = {
          PhysicalState: values.conditionCamera,
          PhysicalStateNoteCode: stringPhysicalStateNoteCode,
          PhysicalStateNote: stringNoteContent
        };

        this.props.cameraVMSController
          .submitCameraConditionForm(this.state.idCamera, paramData)
          .then(result => {
            // console.log(result);
            if (result) {
              this.showSuccessMessage();
              this.setState({
                loading: false
              });
            } else {
              this.showErrorMessage();
              this.setState({
                loading: false
              });
            }
          });
      }
    });
  };
  handleChangeTypeCondition = value => {
    //show another select for not good camera: cam bi mo, sai mau...
    if (value == 2) {
      this.setState({
        showOptionNotGoodCamera: true
      });
    } else {
      this.setState({
        showOptionNotGoodCamera: false
      });
      //set data in OptionNotGoodCamera = undefined
      this.props.form.setFieldsValue({
        conditionNotGoodCamera: undefined
      });
    }

    // cam not good and cam die co them 1 text de ghi chu
    if (value == 1) {
      this.setState({
        showNoteTextArea: false
      });
      //set data in NoteTextArea = undefined
      this.props.form.setFieldsValue({
        noteContent: undefined
      });
    } else {
      this.setState({
        showNoteTextArea: true
      });
    }
  };

  handleChangeConditionNotGoodCamera = value => {
    // console.log(value);
  };

  handleCancelModal = () => {
    this.setState({
      showModal: false
    });
    const { closeSubmitForm } = this.props;
    closeSubmitForm();
  };

  getDataInforCameraCondition(idCamera) {
    if (idCamera != "") {
      this.props.cameraVMSController
        .getInformationConditionCamera(idCamera)
        .then(result => {
          this.setState({
            loading: true
          });
          if (result) {
            let stringPhysicalState,
              stringPhysicalStateNoteCode,
              stringPhysicalStateNote;

            if (result.PhysicalState == null) {
              stringPhysicalState = undefined;
            } else {
              stringPhysicalState = result.PhysicalState;

              //setup option in form
              if (stringPhysicalState == "2") {
                this.setState({
                  showOptionNotGoodCamera: true
                });
              } else {
                this.setState({
                  showOptionNotGoodCamera: false
                });
                //set data in OptionNotGoodCamera = undefined
                this.props.form.setFieldsValue({
                  conditionNotGoodCamera: undefined
                });
              }
              // cam not good and cam die co them 1 text de ghi chu
              if (stringPhysicalState == "1") {
                this.setState({
                  showNoteTextArea: false
                });
                //set data in NoteTextArea = undefined
                this.props.form.setFieldsValue({
                  noteContent: undefined
                });
              } else {
                this.setState({
                  showNoteTextArea: true
                });
              }
            }

            if (
              result.PhysicalStateNoteCode == null ||
              result.PhysicalStateNoteCode == ""
            ) {
              stringPhysicalStateNoteCode = undefined;
            } else {
              stringPhysicalStateNoteCode = result.PhysicalStateNoteCode.split(
                ","
              );
            }

            if (result.PhysicalStateNote == "") {
              stringPhysicalStateNote = undefined;
            } else {
              stringPhysicalStateNote = result.PhysicalStateNote;
            }

            this.props.form.setFieldsValue({
              conditionCamera: stringPhysicalState,
              conditionNotGoodCamera: stringPhysicalStateNoteCode,
              noteContent: stringPhysicalStateNote
            });
          } else {
            this.showErrorMessageLoad();
          }

          this.setState({
            loading: false
          });
        });
    }
  }

  getHistoryReportCamera(idCamera, paramData) {
    if (idCamera != "") {
      this.setState({
        loading: true
      });
      this.props.cameraVMSController
        .getHistoryReportCamera(idCamera, paramData)
        .then(result => {
          if (result) {
            let dataRes = result.data;
            dataRes.map(report => {
              let condition = this.props.defineConditionCamera.filter(
                define => {
                  return define.Code === report.PhysicalState;
                }
              )[0];

              report.PhysicalState = condition.Content_vi;

              if (
                report.PhysicalStateNoteCode &&
                report.PhysicalStateNoteCode != ""
              ) {
                let listCode = report.PhysicalStateNoteCode.split(",");
                let content = "";
                listCode.map((code, index) => {
                  let error = this.props.defineConditionNotGoodCamera.filter(
                    errorNotGood => {
                      return errorNotGood.Code == code;
                    }
                  )[0];
                  if (index < listCode.length - 1) {
                    content += error.Content_vi + ", ";
                  } else {
                    content += error.Content_vi;
                  }
                });

                report.PhysicalStateNoteCode = content;
              } else {
                report.PhysicalStateNoteCode = null;
              }

              if (!report.PhysicalStateNote || report.PhysicalStateNote == "") {
                report.PhysicalStateNote = null;
              }
            });

            this.setState({
              totalRecordReport: result.total,
              recordPerPage: result.per_page,
              dataHistoryReport: result.data
            });
          } else {
            this.showErrorMessageLoad();
          }
          this.setState({
            loading: false
          });
        });
    }
  }

  showSuccessMessage = () => {
    message.success("Báo cáo tình trạng camera thành công");
    message.config({
      duration: 3
    });
  };

  showErrorMessage = () => {
    message.error("Báo cáo tình trạng camera thất bại. Vui lòng thử lại");
    message.config({
      duration: 3
    });
  };

  showErrorMessageLoad = () => {
    message.error("Có lỗi xảy ra . Vui lòng thử lại");
    message.config({
      duration: 5
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: {
        xl: { span: 8 },
        lg: { span: 8 },
        md: { span: 10 },
        sm: { span: 12 },
        xs: { span: 10 }
      },
      wrapperCol: {
        xl: { span: 12 },
        lg: { span: 12 },
        md: { span: 12 },
        sm: { span: 12 },
        xs: { span: 24, offset: 0 }
      }
    };
    return (
      <div class="formSubmit">
        <Modal
          visible={this.state.showModal}
          title="Báo cáo tình trạng Camera"
          onCancel={this.handleCancelModal}
          footer={null}
          width="75%"
          zIndex={1600}
        >
          <Spin spinning={this.state.loading} tip="Đang tải...">
            <div
              style={
                this.state.showHistoryReport
                  ? { display: "none" }
                  : {
                      display: "",
                      height: "30px",
                      cursor: "pointer",
                      marginTop: "20px"
                    }
              }
              onClick={() => {
                this.setState({
                  showHistoryReport: true
                });
              }}
            >
              <Icon
                type="left"
                theme="outlined"
                style={{
                  color: "#1890ff",
                  fontSize: "18px",
                  position: "absolute"
                }}
              />
              <a
                style={{
                  position: "absolute",
                  marginTop: "-1px",
                  marginLeft: "18px"
                }}
              >
                Lịch sử báo cáo
              </a>
            </div>
            <Form
              style={
                this.state.showHistoryReport
                  ? { display: "none" }
                  : { display: "" }
              }
              onSubmit={this.handleSubmit}
            >
              {/* <FormItem
                wrapperCol={{
                  xl: { span: 24 },
                  lg: { span: 24 },
                  md: { span: 24 },
                  sm: { span: 24 },
                  xs: { span: 24 }
                }}
                onClick={() => {
                  this.setState({
                    showHistoryReport: true
                  });
                }}
              >
                <Icon
                  type="left"
                  theme="outlined"
                  style={{
                    color: "#1890ff",
                    fontSize: "18px",
                    position: "absolute"
                  }}
                />
                <a>Lịch sử báo cáo</a>
              </FormItem> */}
              <FormItem {...formItemLayout} label="Tình trạng camera hiện tại">
                {getFieldDecorator("conditionCamera", {
                  rules: [
                    {
                      required: true,
                      message: "Chọn một tình trạng cho camera!"
                    }
                  ]
                })(
                  <Select
                    onChange={this.handleChangeTypeCondition}
                    placeholder="Chọn một loại tình trạng camera sau đây"
                    allowClear={true}
                    defaultValue={null}
                  >
                    {this.state.listConditionCamera}
                  </Select>
                )}
              </FormItem>
              <FormItem
                wrapperCol={{
                  xl: { offset: 8, span: 12 },
                  lg: { offset: 8, span: 12 },
                  md: { offset: 10, span: 12 },
                  sm: { offset: 12, span: 12 },
                  xs: { offset: 0, span: 24 }
                }}
                style={
                  this.state.showOptionNotGoodCamera
                    ? { display: "", marginTop: "-20px" }
                    : { display: "none" }
                }
              >
                {getFieldDecorator("conditionNotGoodCamera", {
                  rules: [
                    {
                      required: this.state.showOptionNotGoodCamera,
                      message: "Cần chọn ít nhất một trong các ý kiến!",
                      type: "array"
                    }
                  ]
                })(
                  <Select
                    onChange={this.handleChangeConditionNotGoodCamera}
                    defaultValue={null}
                    allowClear={true}
                    mode="multiple"
                    placeholder="Chọn một trong các ý kiến sau đây"
                  >
                    {this.state.listConditionNotGoodCamera}
                  </Select>
                )}
              </FormItem>
              <FormItem
                {...formItemLayout}
                label="Ý kiến bổ sung"
                style={
                  this.state.showNoteTextArea
                    ? { display: "", marginTop: "-20px" }
                    : { display: "none" }
                }
              >
                {getFieldDecorator(
                  "noteContent",
                  {}
                )(<TextArea rows={4} placeholder="Ghi ý kiến bổ sung" />)}
              </FormItem>
              <FormItem wrapperCol={{ span: 20 }}>
                <Button
                  style={{ float: "right" }}
                  type="primary"
                  htmlType="submit"
                >
                  Gửi báo cáo
                </Button>
              </FormItem>
            </Form>

            <div
              id="historyReport"
              style={
                this.state.showHistoryReport
                  ? { display: "", marginTop: "20px" }
                  : { display: "none" }
              }
            >
              <div
                style={{ height: "30px", cursor: "pointer" }}
                onClick={() => {
                  this.setState({
                    showHistoryReport: false
                  });
                }}
              >
                <Icon
                  type="left"
                  theme="outlined"
                  style={{
                    color: "#1890ff",
                    fontSize: "18px",
                    position: "absolute"
                  }}
                />
                <a
                  style={{
                    position: "absolute",
                    marginTop: "-1px",
                    marginLeft: "18px"
                  }}
                >
                  Quay lại
                </a>
              </div>

              <List
                itemLayout="horizontal"
                dataSource={this.state.dataHistoryReport}
                pagination={{
                  onChange: page => {
                    this.setState({
                      dataHistoryReport: []
                    });
                    this.getHistoryReportCamera(this.state.idCamera, {
                      page: page
                    });
                  },
                  total: this.state.totalRecordReport,
                  pageSize: this.state.recordPerPage
                }}
                locale={{ emptyText: "Không có dữ liệu" }}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      // avatar={
                      //   <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />
                      // }
                      title={<h4>{item.UserNameBKA}</h4>}
                      description={<div>{item.UpdateTimeBKA}</div>}
                    />
                    {item.PhysicalState}
                    {item.PhysicalStateNoteCode ? <br></br> : ""}
                    {item.PhysicalStateNoteCode}
                    {item.PhysicalStateNote ? <br></br> : ""}
                    {item.PhysicalStateNote}
                  </List.Item>
                )}
              />
            </div>
          </Spin>
        </Modal>
      </div>
    );
  }
}

const FormSubmitStatusCamera = Form.create()(FormSubmitStatusCamera1);
export default FormSubmitStatusCamera;
