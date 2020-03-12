import {Component} from 'react';
import React from "react";

import './styles/InfoWindow.css';

class FaceDetectComponent extends Component {

    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        const {handleFaceDetectClick, person} = this.props;
        const date = new Date(person.imageArray[0].startDate*1000);
        const title = person.objectName + ' - ' + person.objectNote + ' - ' + date.toLocaleString();
        handleFaceDetectClick(person.objectId, title);
    }
    render() {
        const {person} = this.props;
        return (
            <div
                style={{
                    width: '100%',
                    height: 50,
                    lineHeight: '50px',
                    fontSize: 15,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    webkitLineClamp: '1',
                    webkitBoxOrient: 'vertical',
                }}
                onClick={this.onClick}
            >
                <img
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                    }}
                    src={person.imageArray[0].imagePath}
                />
                <span style={{paddingLeft: 10}}>{person.objectName + ' - ' + person.objectNote}</span>
            </div>
        );
    }
}

class ListFaceDetectComponent extends Component {
    render() {
        const {faceDetectData, handleFaceDetectClick} = this.props;
        return (
            <div
                style={{
                    paddingLeft: 2,
                    height: 'calc(100% - 46px)',
                }}
                id='styleScroll'
            >
                {
                    faceDetectData.slice(0, 5).map((person) => (
                        <FaceDetectComponent
                            person={person}
                            handleFaceDetectClick={handleFaceDetectClick}
                        />
                    ))
                }
            </div>
        )
    }
}

export default ListFaceDetectComponent;
