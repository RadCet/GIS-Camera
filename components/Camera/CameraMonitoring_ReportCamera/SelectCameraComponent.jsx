import React from 'react';
import {TextHelper} from "./controller/TextHelper";

class SelectCameraComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            valueNormaled: '',
        };
        this.onChange = this.onChange.bind(this);
        this.onSelect = this.onSelect.bind(this);
    }

    onChange(event) {
        const _event = event.target.value;
        this.setState({
            valueNormaled: TextHelper.normalText( _event),
            value: _event
        })
    }

    onSelect(camera) {
        console.log(JSON.stringify(camera.tSearch));
        const {handleFilterCamera} = this.props;
        handleFilterCamera(camera);
    }

    render() {
        const {height, cameraDataByLayer, numberListCameraDisplay} = this.props;
        let cameraDataByLayerFiltered = cameraDataByLayer.filter((item) => item.level === 1 || item.level === 2);

        const {value, valueNormaled} = this.state;
        return (
            <div>
                <input
                    type="text"
                    value={value}
                    onChange={this.onChange}
                    placeholder="Tìm kiếm camera"
                    style={{color: 'black'}}
                    />
                <div style={{overflowY: 'auto', height: height - 50}} id='styleScroll'>
                    {
                        cameraDataByLayerFiltered.map((item, index) => {
                            if(valueNormaled.length === 0 && (numberListCameraDisplay < 0 || index < numberListCameraDisplay) && item.vmsCamId !== 0) {
                                return (
                                    <div style={{cursor: 'pointer'}}>
                                        <a style={{cursor: 'pointer'}} onClick={()=>this.onSelect(item)}>{item.name}</a>
                                    </div>
                                );
                            }
                            else if (valueNormaled.length > 0 && item.tSearch.find(item => item.indexOf(valueNormaled) > 0)) {
                            // else if(value.length > 0 && item.name.toLowerCase().indexOf(value.toLowerCase()) >= 0 && item.vmsCamId !== 0) {
                                return (
                                    <div style={{cursor: 'pointer'}}>
                                        <a onClick={()=>this.onSelect(item)}>{item.name}</a>
                                    </div>
                                );
                            }
                            return null;
                        })
                    }
                </div>
            </div>
        );
    }
}

export default SelectCameraComponent;
