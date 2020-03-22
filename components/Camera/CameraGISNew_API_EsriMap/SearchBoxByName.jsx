import React from 'react';
import ReactDOM from 'react-dom';
import { Input, Select } from 'antd';
import "antd/dist/antd.css";
import {TextHelper} from './controller/TextHelper'

const { Option } = Select;

export default class SearchBoxByName extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
        this.onSelect = this.onSelect.bind(this);
        this.normalText = this.normalText.bind(this);
        this.filterOption = this.filterOption.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.onInputKeyDown = this.onInputKeyDown.bind(this);
    }

    onSelect(index) {
        const { handleSelectSearch, cameraData } = this.props;
        let camera = cameraData[index];
        if (!!camera) {
            console.log(JSON.stringify(camera.tSearch));
            handleSelectSearch(camera);
        }
    }

    normalText(string) {
        return TextHelper.normalText(string);
        // return string == null ? null : string.toLowerCase();
    }

    filterOption(input, option) {
        // let result = option.props.children.toLowerCase().indexOf(this.input) >= 0;
        if (this.input == null || option.props.tsearch == null) {
            return false;
        }
        let result = option.props.tsearch.find(item => item.indexOf(this.input) >= 0);
        return result;
    }

    onSearch(input) {
        this.input = this.normalText(input);
    }

    onInputKeyDown(event) {
        // if (event.key === "Enter") {
        // }
    }

    render() {
        const { isMobile } = this.props;
        const width = isMobile ? 200 : 250;
        const { cameraData } = this.props;
        const colors = [
            '#ec1c23', '#0abf71', '#2dc0d2',
            '#ff7708', '#ff7708', '#ff7708',
            '#751f13', '#777777',
            '#ff7708', '#2dc0d2', '#ec1c23',
        ];
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
                    onSearch={this.onSearch}
                    onInputKeyDown={this.onInputKeyDown}
                    filterOption={this.filterOption}
                    // onChange={this.onSelect}
                    // filterOption={(input, option) =>
                    //     option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    // }
                >

                    {
                        cameraData.map((item, index) => {
                            return (
                                <Option
                                    key={index}
                                    tsearch={item.tSearch}
                                    value={index}
                                    style={{ color: colors[item.ailevel != null ? item.ailevel : item.glevel ? item.glevel : item.level] }}>
                                    {item.name}
                                </Option>
                            );
                        })
                    }
                </Select>
            </div>
        );
    }
}
