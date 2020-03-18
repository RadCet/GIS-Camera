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
      showModal: false
    };
  }

  componentDidMount() {
    this.setState({
      showModal: this.props.showSubmitForm
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.showSubmitForm != this.props.showSubmitForm) {
      this.setState({
        showModal: this.props.showSubmitForm
      });
    }
  }

  componentWillUnmount() {
    // this.searchBox.removeListener('places_changed', this.onPlacesChanged);
  }
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log("Received values of form: ", values);
      }
    });

    // console.log("gasdh12312 v1 231");
    var tarea = document.getElementById("note").value;
    console.log(tarea);

    setTimeout(() => {
      document.getElementById("note").value = "datn ngu sisi";
    }, 3000);

    setTimeout(() => {
      document.getElementById("note").value = tarea;
    }, 5000);
  };
  handleSelectChange = value => {
    console.log(value);
    // this.props.form.setFieldsValue({
    //   note: `Hi, ${value === "male" ? "man" : "lady"}!`
    // });
  };

  handleMutipleSelectChange = value => {
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
                  { required: true, message: "Chọn một tình trạng cho camera!" }
                ]
              })(
                <Select defaultValue="lucy" onChange={this.handleSelectChange}>
                  <Option value="male">male</Option>
                  <Option value="female">female</Option>
                </Select>
              )}
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
                  mode="multiple"
                  placeholder="Chọn một ý kiến sau đây"
                  onChange={this.handleMutipleSelectChange}
                >
                  <Option value="red">Red</Option>
                  <Option value="green">Green</Option>
                  <Option value="blue">Blue</Option>
                </Select>
              )}
            </FormItem>
            {/* <FormItem
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 12 }}
              label=" "
            ></FormItem> */}
            <FormItem {...formItemLayout} label="Ý kiến bổ sung">
              {getFieldDecorator(
                "note",
                {}
              )(
                <TextArea
                  rows={4}
                  placeholder="Ghi ý kiến bổ sung"
                />
              )}
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
