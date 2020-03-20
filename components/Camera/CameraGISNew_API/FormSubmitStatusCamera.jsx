import React from "react";
import ReactDOM from "react-dom";
import { Modal, Form, Select, Input, Button, message } from "antd";
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
      showNoteTextArea: false
    };

    this.setupFormSubmit = this.setupFormSubmit.bind(this);
    this.resetDataForm = this.resetDataForm.bind(this);
    this.getDataInforCameraCondition = this.getDataInforCameraCondition.bind(
      this
    );
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
        showModal: this.props.showSubmitForm
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
  }

  resetDataForm() {
    this.props.form.setFieldsValue({
      conditionCamera: undefined,
      conditionNotGoodCamera: undefined,
      noteContent: undefined
    });
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);

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
            if (result) {
              this.showSuccessMessage();
            } else {
              this.showErrorMessage();
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
          console.log(result);
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

  render() {
    const { getFieldDecorator } = this.props.form;
    const formItemLayout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 12 }
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
          <Form style={{ marginTop: "50px" }} onSubmit={this.handleSubmit}>
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
              wrapperCol={{ offset: 8, span: 12 }}
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
        </Modal>
      </div>
    );
  }
}

const FormSubmitStatusCamera = Form.create()(FormSubmitStatusCamera1);
export default FormSubmitStatusCamera;
