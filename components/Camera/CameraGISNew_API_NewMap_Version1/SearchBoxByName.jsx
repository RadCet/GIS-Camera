import React from 'react';
import ReactDOM from 'react-dom';
import { Input, Select } from 'antd';
import "antd/dist/antd.css";

const { Option } = Select;

export default class SearchBoxByName extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.onSelect = this.onSelect.bind(this);
    }

    onSelect(index) {
        const { handleSelectSearch, cameraData } = this.props;
        handleSelectSearch(cameraData[index]);
    }

    render() {
        const { isMobile } = this.props;
        const width = isMobile ? 200 : 250;
        const { cameraData } = this.props;
        const colors = ['#ec1c23', '#0abf71', '#2dc0d2', '#ff7708', '#ff7708', '#ff7708', '#751f13'];
        return (
            <div style={{ display: 'inline-block', width: '100%', paddingRight: '10px', paddingTop: '5px' }}>
                <Select
                    id='searchByName'
                    showSearch
                    allowClear={true}
                    style={{ width: '100%' }}
                    placeholder='Chọn theo tên cam'
                    optionFilterProp='children'
                    onChange={this.onSelect}
                    filterOption={(input, option) =>
                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                >

                    {
                        cameraData.map((item, index) => {
                            return (
                                <Option value={index} style={{ color: colors[item.ailevel != null ? item.ailevel : item.glevel ? item.glevel : item.level] }}>{item.name}</Option>
                            );
                        })
                    }
                </Select>
            </div>
        );
    }
}
