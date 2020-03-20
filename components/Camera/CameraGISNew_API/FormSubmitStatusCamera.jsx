import React from "react";
import ReactDOM from "react-dom";
import { Modal, Form, Select, Input, Button } from "antd";
const { TextArea } = Input;
const FormItem = Form.Item;
const Option = Select.Option;
import "antd/dist/antd.css";
import "./styles/SubmitForm.css";
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
      (this.state.idCamera == "" || prevState.idCamera != this.state.idCamera)
    ) {
      this.setState({
        idCamera: this.props.idCamera
      });
      console.log(this.state.idCamera);
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
          cameraVMSController
            .getInformationConditionCamera("1")
            .then(result => {
              console.log(result);
            });

          let param = {
            PhysicalStateNote: "datvtd test"
          };
          cameraVMSController
            .submitCameraConditionForm("1", param)
            .then(result => {
              console.log(result);
            });
        } else {
          this.resetDataForm();
        }
        this.setupFormSubmit(
          defineConditionCamera,
          defineConditionNotGoodCamera
        );
      }

      // let a = this.props.form.getFieldsValue([
      //   "statusCamera",
      //   "statusNotGoodCamera",
      //   "noteContent"
      // ]);

      // console.log(a);
      // console.log("++++++++++++");
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
  }

  resetDataForm() {
    this.props.form.setFieldsValue({
      statusCamera: undefined,
      statusNotGoodCamera: undefined,
      noteContent: undefined
    });
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
      }
    });

    // console.log("gasdh12312 v1 231");
    // var tarea = document.getElementById("noteContent").value;
    // console.log(tarea);

    // setTimeout(() => {
    //   document.getElementById("noteContent").value = "datn ngu sisi";
    // }, 3000);

    // setTimeout(() => {
    //   document.getElementById("noteContent").value = tarea;
    // }, 5000);
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
    }

    // cam not good and cam die co them 1 text de ghi chu
    if (value == 1) {
      this.setState({
        showNoteTextArea: false
      });
    } else {
      this.setState({
        showNoteTextArea: true
      });
    }
  };

  handleChangeConditionNotGoodCamera = value => {
    console.log(value);
  };

  handleCancelModal = () => {
    this.setState({
      showModal: false
    });
    const { closeSubmitForm } = this.props;
    closeSubmitForm();
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
              {getFieldDecorator("statusCamera", {
                rules: [
                  {
                    required: this.state.showOptionNotGoodCamera,
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
              {getFieldDecorator("statusNotGoodCamera", {
                rules: [
                  {
                    required: true,
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
            <FormItem {...formItemLayout} label="Ý kiến bổ sung">
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
