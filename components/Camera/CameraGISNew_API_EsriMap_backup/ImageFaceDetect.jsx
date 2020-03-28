import {Component} from 'react';
import React from "react";
import nextIcon from './resources/events/next.png';
import prevIcon from './resources/events/prev.png';

class ImageFaceDetect extends Component {

    constructor(props) {
        super(props);
        this.state = {
            position: 0,
            array: [],
            rate: 1,
        };
        this.handleBackImg = this.handleBackImg.bind(this);
        this.handleNextImg = this.handleNextImg.bind(this);
        this.updateArrayXY = this.updateArrayXY.bind(this);
        this.updateRatingImage = this.updateRatingImage.bind(this);
    }
    componentDidMount() {
        this.updateArrayXY();
    }
    updateRatingImage(naturalWidth, width) {
        const rate = naturalWidth/width;
        this.setState({rate: rate});
    }
    updateArrayXY() {
        const {imageArray} = this.props;
        const {position} = this.state;
        const arrayXY = imageArray[position].XYWH.split('-');
        this.setState({array: arrayXY});
    }
    handleBackImg() {
        const {imageArray, data, updateTitle} = this.props;
        const {position} = this.state;
        const positionBack = (position === 0) ? 0 : (position - 1);
        const date = new Date(imageArray[positionBack].startDate*1000);
        const title = data.objectName + ' - ' + data.objectNote + ' - ' + date.toLocaleString();
        const arrayXY = imageArray[positionBack].XYWH.split('-');
        this.setState({
            position: positionBack,
            array: arrayXY,

        });
        // this.updateRatingImage();
        updateTitle(title);
    }
    handleNextImg() {
        const {imageArray, data, updateTitle} = this.props;
        const {position} = this.state;
        const posiotionNext = (position === (imageArray.length - 1)) ? (imageArray.length - 1) : (position + 1);
        const date = new Date(imageArray[posiotionNext].startDate*1000);
        const title = data.objectName + ' - ' + data.objectNote + ' - ' + date.toLocaleString();
        const arrayXY = imageArray[posiotionNext].XYWH.split('-');
        this.setState({
            position: posiotionNext,
            array: arrayXY,
        });
        // this.updateRatingImage();
        updateTitle(title);
    }

    render() {
        const {imageArray} = this.props;
        const {position, array, rate} = this.state;
        const rectangleStyle = {
            position: 'absolute',
            left: parseInt(array[0])/rate,
            top: parseInt(array[1])/rate,
            width: parseInt(array[2])/rate,
            height: parseInt(array[3])/rate,
            border: '2px solid red',
        };
        return (
            <div style={{width: '100%', height: '100%'}}>
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: 5,
                    }}
                >
                    <img
                        style={{
                            width: 20,
                            cursor: (position === (imageArray.length - 1)) ? null : 'pointer' ,
                            marginRight: 15,
                            opacity: (position === (imageArray.length - 1)) ? 0.5 : undefined,
                        }}
                        src={prevIcon}
                        onClick={this.handleNextImg}
                    />
                    <span style={{fontSize: 18}}>{imageArray.length - position}/{imageArray.length}</span>
                    <img
                        style={{
                            width: 20,
                            cursor: (position === 0) ? null : 'pointer',
                            marginLeft: 15,
                            opacity: (position === 0) ? 0.5 : undefined,
                        }}
                        src={nextIcon}
                        onClick={this.handleBackImg}
                    />
                </div>
                <div style={{position: 'relative'}}>
                    <img
                        id="imageFace"
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                        src={imageArray[position].imagePath}
                        onLoad={({ target: img }) => this.updateRatingImage(img.naturalWidth, img.width)}
                    />
                    <div style={rectangleStyle} />
                </div>
            </div>
        );
    }
}

export default ImageFaceDetect;
